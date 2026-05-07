import {
  ApexChart, ApexXAxis, ApexYAxis, ApexStroke, ApexFill,
  ApexTooltip, ApexDataLabels, ApexGrid, ApexLegend,
  ApexPlotOptions, ApexMarkers,
} from 'ng-apexcharts';
import { ChartColumn } from '../../../shared/services/chatbot-bi.service';

export interface ComputedChart {
  chartId: string;
  type: string;
  title: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  series: any[];
  labels: string[];
  apexChart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis | ApexYAxis[];
  colors: string[];
  fill: ApexFill;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  grid: ApexGrid;
  legend: ApexLegend;
  tooltip: ApexTooltip;
  markers: ApexMarkers;
  columns: ChartColumn[];
  tableData: Record<string, unknown>[];
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  typedText?: string;
  timestamp: Date;
  charts?: ComputedChart[];
  recommendedChartIdx?: number;
  rowCount?: number;
  executionMs?: number;
  suggestedFollowUps?: string[];
  sqlGenerated?: string;
  isThinking?: boolean;
  thinkingStep?: string;
}

export interface TableState {
  page: number;
  sortKey: string;
  sortAsc: boolean;
}
