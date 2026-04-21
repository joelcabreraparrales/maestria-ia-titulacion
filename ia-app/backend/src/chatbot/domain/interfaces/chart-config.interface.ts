/** Serie de datos — el frontend llena .data usando .dataKey */
export interface ApexSeries {
  name: string;
  dataKey: string;       // columna de data[] a mapear (eje Y / valor)
  data: never[];         // SIEMPRE [] — lo llena el frontend
  type?: string;         // solo gráficos mixtos: "bar" | "line"
  zKey?: string;         // solo bubble: columna de tamaño de burbuja
}

export interface ChartColumn {
  key: string;
  label: string;
  type: "string" | "number" | "date";
}

/** Configuración ApexCharts nativa — cada propiedad mapea directamente a un binding de ng-apexcharts */
export interface ChartConfig {
  type: string;          // "bar" | "line" | "area" | "pie" | "donut" | "polarArea" | "radar" | "scatter" | "bubble" | "heatmap" | "table"
  title: string;
  description?: string;
  series: ApexSeries[];  // series con dataKey — el frontend llena .data
  // ── Bindings ng-apexcharts ────────────────────────────────────
  apexChart: {
    type: string;
    height: number;
    toolbar: { show: boolean };
    stacked?: boolean;
    stackType?: string;  // "100%" para stacked_bar_100
  };
  xaxis: Record<string, unknown>;                                  // [xaxis]  — categories se añade en frontend
  yaxis: Record<string, unknown> | Record<string, unknown>[];     // [yaxis]  — objeto o array para doble eje
  colors: string[];                                                // [colors]
  stroke: Record<string, unknown>;                                 // [stroke]
  fill: Record<string, unknown>;                                   // [fill]
  dataLabels: Record<string, unknown>;                             // [dataLabels]
  plotOptions: Record<string, unknown>;                            // [plotOptions]
  grid: Record<string, unknown>;                                   // [grid]
  legend: Record<string, unknown>;                                 // [legend]
  tooltip: Record<string, unknown>;                                // [tooltip]
  markers: Record<string, unknown>;                                // [markers]
  columns?: ChartColumn[];                                         // solo type === "table" | "heatmap_table"
}

export interface ChartItem {
  chartId: string;       // identificador semántico: multi_line, bar_line_mixed, table, etc.
  labelKey: string;      // columna de data[] para eje X / labels / segmentos
  chartConfig: ChartConfig;
}

export interface AnalysisResult {
  charts: ChartItem[];
  recommendedChart: number;
  explanation: string;
  suggestedFollowUps: string[];
}
