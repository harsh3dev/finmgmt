import { v4 as uuidv4 } from 'uuid';
import { 
  DashboardTemplate, 
  TemplateApplicationResult, 
  TemplateSetupConfig,
  TemplateGalleryFilter
} from '@/types/template';
import { Widget, ApiEndpoint } from '@/types/widget';

export async function loadTemplate(templateId: string): Promise<DashboardTemplate | null> {
  try {
    const { getAvailableTemplates } = await import('../constants/dashboard-templates');
    const templates = getAvailableTemplates();
    return templates.find((t: DashboardTemplate) => t.id === templateId) || null;
  } catch (error) {
    console.error('Failed to load template:', error);
    return null;
  }
}

export async function applyTemplate(
  template: DashboardTemplate, 
  config?: TemplateSetupConfig
): Promise<TemplateApplicationResult> {
  try {
    const newApiEndpoints: ApiEndpoint[] = template.apiEndpoints.map(api => {
      let updatedUrl = api.url;
      
      if (api.url.includes('alphavantage.co') && api.url.endsWith('apikey=')) {
        const apiKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;
        console.log('Alpha Vantage API Key found:', apiKey ? 'YES' : 'NO');
        if (apiKey) {
          updatedUrl = api.url + apiKey;
          console.log('Updated Alpha Vantage URL:', updatedUrl);
        }
      }
      
      if (api.url.includes('indianapi.in')) {
        const indianApiKey = process.env.NEXT_PUBLIC_INDIAN_API_KEY;
        console.log('Indian API Key found:', indianApiKey ? 'YES' : 'NO');
        if (indianApiKey && (!api.headers || !api.headers['X-Api-Key'])) {
          console.log('Adding Indian API key to headers');
          return {
            ...api,
            id: uuidv4(),
            url: updatedUrl,
            headers: {
              ...api.headers,
              'X-Api-Key': indianApiKey
            },
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }
      }
      
      return {
        ...api,
        id: uuidv4(),
        url: updatedUrl,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    const apiIdMapping: Record<string, string> = {};
    template.apiEndpoints.forEach((originalApi, index) => {
      apiIdMapping[originalApi.id] = newApiEndpoints[index].id;
    });

    const newWidgets: Widget[] = template.widgets.map(widget => ({
      ...widget,
      id: uuidv4(),
      apiEndpointId: apiIdMapping[widget.apiEndpointId!] || widget.apiEndpointId,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    if (config?.customName) {
      newWidgets.forEach(widget => {
        widget.name = `${config.customName} - ${widget.name}`;
      });
    }

    return {
      success: true,
      widgets: newWidgets,
      apiEndpoints: newApiEndpoints,
      templateId: template.id
    };

  } catch (error) {
    console.error('Failed to apply template:', error);
    return {
      success: false,
      widgets: [],
      apiEndpoints: [],
      templateId: template.id,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function getAvailableTemplates(): Promise<DashboardTemplate[]> {
  try {
    const { getAvailableTemplates: getTemplates } = await import('../constants/dashboard-templates');
    return getTemplates();
  } catch (error) {
    console.error('Failed to load available templates:', error);
    return [];
  }
}

export async function searchTemplates(filter: TemplateGalleryFilter): Promise<DashboardTemplate[]> {
  try {
    const templates = await getAvailableTemplates();
    
    return templates.filter(template => {
      if (filter.category && template.category !== filter.category) {
        return false;
      }

      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        const searchableText = [
          template.name,
          template.description,
          template.author,
          ...template.setupInstructions
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    });
  } catch (error) {
    console.error('Failed to search templates:', error);
    return [];
  }
}

export function generateTemplatePreviewData(template: DashboardTemplate): Record<string, unknown> {
  const demoData: Record<string, unknown> = {};

  template.apiEndpoints.forEach(api => {
    switch (api.category) {
      case 'stocks':
        demoData[api.id] = {
          'Global Quote': {
            '01. symbol': 'AAPL',
            '05. price': '175.50',
            '09. change': '2.35',
            '10. change percent': '1.36%'
          }
        };
        break;
      
      case 'indices':
        demoData[api.id] = {
          'Global Quote': {
            '01. symbol': 'SPY',
            '05. price': '445.20',
            '09. change': '1.85',
            '10. change percent': '0.42%'
          }
        };
        break;
      
      default:
        demoData[api.id] = { 
          value: 100, 
          status: 'active',
          timestamp: new Date().toISOString() 
        };
    }
  });

  return demoData;
}
