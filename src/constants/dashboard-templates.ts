import { DashboardTemplate } from '@/types/template';

// Alpha Vantage Stock Portfolio Template
const stockPortfolioTemplate: DashboardTemplate = {
  id: 'stock-portfolio-template',
  name: 'Alpha Vantage Stock Portfolio',
  description: 'Track your stock investments with real-time prices, portfolio performance, and market indices using Alpha Vantage API.',
  category: 'stocks',
  author: 'Finance Dashboard Team',
  version: '1.0.0',
  previewImage: '/templates/stock-portfolio-preview.png',
  setupInstructions: [
    'Alpha Vantage API key is already configured in environment variables',
    'This template provides 5 requests per minute and 500 requests per day',
    'You can track multiple stocks by creating additional widgets'
  ],
  apiEndpoints: [
    {
      id: 'alpha-vantage-stocks-api',
      name: 'Alpha Vantage Stock Quotes',
      url: 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=',
      headers: {},
      description: 'Real-time stock quotes from Alpha Vantage',
      category: 'stocks',
      rateLimit: {
        requestsPerMinute: 5,
        requestsPerHour: 300,
        requestsPerDay: 500
      },
      createdAt: new Date('2025-09-01'),
      updatedAt: new Date('2025-09-01')
    },
    {
      id: 'alpha-vantage-indices-api',
      name: 'Alpha Vantage Market Indices',
      url: 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=SPY&apikey=',
      headers: {},
      description: 'Market indices data from Alpha Vantage',
      category: 'indices',
      rateLimit: {
        requestsPerMinute: 5,
        requestsPerHour: 300,
        requestsPerDay: 500
      },
      createdAt: new Date('2025-09-01'),
      updatedAt: new Date('2025-09-01')
    }
  ],
  widgets: [
    {
      id: 'aapl-stock-widget',
      name: 'Apple Stock (AAPL)',
      apiUrl: '',
      apiEndpointId: 'alpha-vantage-stocks-api',
      refreshInterval: 300,
      displayType: 'card',
      position: { x: 0, y: 0, width: 4, height: 3 },
      config: {
        selectedFields: [
          'Global Quote.01. symbol',
          'Global Quote.05. price',
          'Global Quote.09. change',
          'Global Quote.10. change percent'
        ],
        fieldMappings: {
          'Global Quote.01. symbol': 'Symbol',
          'Global Quote.05. price': 'Current Price',
          'Global Quote.09. change': 'Change',
          'Global Quote.10. change percent': 'Change %'
        },
        formatSettings: {
          currency: 'USD',
          decimalPlaces: 2
        },
        styling: {
          backgroundColor: '#ffffff',
          borderRadius: 8,
          shadow: true
        }
      },
      createdAt: new Date('2025-09-01'),
      updatedAt: new Date('2025-09-01')
    },
    {
      id: 'spy-index-widget',
      name: 'S&P 500 Index (SPY)',
      apiUrl: '',
      apiEndpointId: 'alpha-vantage-indices-api',
      refreshInterval: 300,
      displayType: 'card',
      position: { x: 4, y: 0, width: 4, height: 3 },
      config: {
        selectedFields: [
          'Global Quote.01. symbol',
          'Global Quote.05. price',
          'Global Quote.09. change',
          'Global Quote.10. change percent'
        ],
        fieldMappings: {
          'Global Quote.01. symbol': 'Index',
          'Global Quote.05. price': 'Current Price',
          'Global Quote.09. change': 'Change',
          'Global Quote.10. change percent': 'Change %'
        },
        formatSettings: {
          currency: 'USD',
          decimalPlaces: 2
        },
        styling: {
          backgroundColor: '#ffffff',
          borderRadius: 8,
          shadow: true
        }
      },
      createdAt: new Date('2025-09-01'),
      updatedAt: new Date('2025-09-01')
    }
  ],
  layout: {
    columns: 12,
    rows: 6,
    gap: 16,
    padding: 24
  },
  settings: {
    autoRefresh: true,
    globalRefreshInterval: 300,
    theme: 'auto' as const,
    compactMode: false
  },
  templateMetadata: {
    isTemplate: true,
    templateId: 'stock-portfolio-template',
    templateVersion: '1.0.0'
  },
  createdAt: new Date('2025-09-01'),
  updatedAt: new Date('2025-09-01')
};

const indianStocksTemplate: DashboardTemplate = {
  id: 'indian-stocks-template',
  name: 'Indian Trending Stocks',
  description: 'Track trending Indian stocks with real-time data from Indian Stock API.',
  category: 'stocks',
  author: 'Finance Dashboard Team',
  version: '1.0.0',
  previewImage: '/templates/indian-stocks-preview.png',
  setupInstructions: [
    'Indian API key is already configured in environment variables',
    'This template shows trending stocks in the Indian market',
    'Data includes stock prices, changes, and market trends'
  ],
  apiEndpoints: [
    {
      id: 'indian-trending-stocks-api',
      name: 'Indian Trending Stocks API',
      url: 'https://stock.indianapi.in/trending',
      headers: {},
      description: 'Trending stocks data from Indian Stock Market',
      category: 'stocks',
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerHour: 3600,
        requestsPerDay: 86400
      },
      createdAt: new Date('2025-09-01'),
      updatedAt: new Date('2025-09-01')
    }
  ],
  // Widgets using direct Widget structure
  widgets: [
    {
      id: 'trending-stocks-widget',
      name: 'Top Trending Stocks',
      apiUrl: '',
      apiEndpointId: 'indian-trending-stocks-api',
      refreshInterval: 180,
      displayType: 'table',
      position: { x: 0, y: 0, width: 12, height: 4 },
      config: {
        selectedFields: [
          'trending_stocks.top_gainers.0.ticker_id',
          'trending_stocks.top_gainers.0.company_name',
          'trending_stocks.top_gainers.0.price',
          'trending_stocks.top_gainers.0.net_change',
          'trending_stocks.top_gainers.0.percent_change',
          'trending_stocks.top_gainers.1.ticker_id',
          'trending_stocks.top_gainers.1.company_name',
          'trending_stocks.top_gainers.1.price',
          'trending_stocks.top_gainers.1.net_change',
          'trending_stocks.top_gainers.1.percent_change',
          'trending_stocks.top_gainers.2.ticker_id',
          'trending_stocks.top_gainers.2.company_name',
          'trending_stocks.top_gainers.2.price',
          'trending_stocks.top_gainers.2.net_change',
          'trending_stocks.top_gainers.2.percent_change'
        ],
        fieldMappings: {
          'trending_stocks.top_gainers.0.ticker_id': 'Symbol 1',
          'trending_stocks.top_gainers.0.company_name': 'Company Name 1',
          'trending_stocks.top_gainers.0.price': 'Price 1',
          'trending_stocks.top_gainers.0.net_change': 'Change 1',
          'trending_stocks.top_gainers.0.percent_change': 'Change % 1',
          'trending_stocks.top_gainers.1.ticker_id': 'Symbol 2',
          'trending_stocks.top_gainers.1.company_name': 'Company Name 2',
          'trending_stocks.top_gainers.1.price': 'Price 2',
          'trending_stocks.top_gainers.1.net_change': 'Change 2',
          'trending_stocks.top_gainers.1.percent_change': 'Change % 2',
          'trending_stocks.top_gainers.2.ticker_id': 'Symbol 3',
          'trending_stocks.top_gainers.2.company_name': 'Company Name 3',
          'trending_stocks.top_gainers.2.price': 'Price 3',
          'trending_stocks.top_gainers.2.net_change': 'Change 3',
          'trending_stocks.top_gainers.2.percent_change': 'Change % 3'
        },
        formatSettings: {
          currency: 'INR',
          decimalPlaces: 2
        },
        styling: {
          backgroundColor: '#ffffff',
          borderRadius: 8,
          shadow: true
        }
      },
      createdAt: new Date('2025-09-01'),
      updatedAt: new Date('2025-09-01')
    }
  ],
  layout: {
    columns: 12,
    rows: 6,
    gap: 16,
    padding: 24
  },
  settings: {
    autoRefresh: true,
    globalRefreshInterval: 180,
    theme: 'auto' as const,
    compactMode: false
  },
  templateMetadata: {
    isTemplate: true,
    templateId: 'indian-stocks-template',
    templateVersion: '1.0.0'
  },
  createdAt: new Date('2025-09-01'),
  updatedAt: new Date('2025-09-01')
};

// Export only the two specified templates
export const AVAILABLE_TEMPLATES: DashboardTemplate[] = [
  stockPortfolioTemplate,
  indianStocksTemplate
];

/**
 * Gets all available dashboard templates
 */
export function getAvailableTemplates(): DashboardTemplate[] {
  return AVAILABLE_TEMPLATES;
}

/**
 * Gets a template by ID
 */
export function getTemplateById(templateId: string): DashboardTemplate | null {
  return AVAILABLE_TEMPLATES.find(template => template.id === templateId) || null;
}

/**
 * Gets templates by category
 */
export function getTemplatesByCategory(category: string): DashboardTemplate[] {
  return AVAILABLE_TEMPLATES.filter(template => template.category === category);
}

/**
 * Gets popular templates (first 2 for now)
 */
export function getPopularTemplates(): DashboardTemplate[] {
  return AVAILABLE_TEMPLATES.slice(0, 2);
}
