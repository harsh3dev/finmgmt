export interface ChartConfig {
  xAxis?: string;
  yAxis?: string | string[];
  colorField?: string;
  title?: string;
  showLegend?: boolean;
  theme?: 'light' | 'dark';
  animations?: boolean;
  height?: number;
  width?: number;
  colors?: string[];
}

export interface ChartData {
  [key: string]: unknown;
}

export interface ChartComponentProps {
  data: ChartData[];
  config: ChartConfig;
  compact?: boolean;
  className?: string;
}

export interface ChartAnalysis {
  hasTimeField: boolean;
  hasNumericFields: boolean;
  hasCategoricalField: boolean;
  numericFields: string[];
  categoricalFields: string[];
  timeFields: string[];
  recommendedChartType: ChartType;
  reasoning: string;
}

export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'scatter';

export interface ChartDataPoint {
  name?: string;
  value?: number;
  [key: string]: unknown;
}
