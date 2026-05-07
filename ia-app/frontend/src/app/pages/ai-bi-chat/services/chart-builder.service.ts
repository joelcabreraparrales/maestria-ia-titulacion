import { Injectable } from '@angular/core';
import {
  ApexChart, ApexXAxis, ApexYAxis, ApexStroke, ApexFill,
  ApexTooltip, ApexDataLabels, ApexGrid, ApexLegend,
  ApexPlotOptions, ApexMarkers,
} from 'ng-apexcharts';
import { ChartItemDTO } from '../../../shared/services/chatbot-bi.service';
import { ComputedChart } from '../models/chat.models';

@Injectable({ providedIn: 'root' })
export class ChartBuilderService {
  private readonly NON_AXIS_TYPES = new Set(['pie', 'donut', 'polarArea']);

  getChartTypeIcon(chartId: string): string {
    if (chartId === 'table')                                    return '📋';
    if (chartId === 'pie')                                      return '🥧';
    if (chartId === 'donut' || chartId === 'doughnut_kpi')      return '🍩';
    if (chartId === 'radar')                                    return '🕸️';
    if (chartId === 'scatter' || chartId === 'bubble')          return '⚪';
    if (chartId === 'polarArea')                                return '🌐';
    if (chartId === 'bar_line_mixed')                           return '📉';
    if (chartId.includes('line') || chartId === 'area_line' || chartId === 'stacked_area') return '📈';
    return '📊';
  }

  getChartTypeBadge(type: string): string {
    const map: Record<string, string> = {
      bar: 'Barras', line: 'Línea', area: 'Área', pie: 'Pastel',
      donut: 'Dona', polarArea: 'Polar', radar: 'Radar',
      scatter: 'Dispersión', bubble: 'Burbuja', heatmap: 'Mapa calor', table: 'Tabla',
    };
    return map[type] ?? type;
  }

  buildChartFromItem(item: ChartItemDTO, data: Record<string, unknown>[]): ComputedChart {
    const { chartId, labelKey, chartConfig } = item;

    const base = {
      chartId,
      type:        chartConfig.type,
      title:       chartConfig.title,
      description: chartConfig.description ?? '',
      apexChart:   { fontFamily: 'Outfit, sans-serif', ...chartConfig.apexChart } as ApexChart,
      yaxis:       chartConfig.yaxis       as ApexYAxis | ApexYAxis[],
      colors:      chartConfig.colors,
      fill:        chartConfig.fill        as ApexFill,
      stroke:      chartConfig.stroke      as ApexStroke,
      dataLabels:  chartConfig.dataLabels  as ApexDataLabels,
      plotOptions: chartConfig.plotOptions as ApexPlotOptions,
      grid:        chartConfig.grid        as ApexGrid,
      legend:      chartConfig.legend      as ApexLegend,
      tooltip:     chartConfig.tooltip     as ApexTooltip,
      markers:     chartConfig.markers     as ApexMarkers,
    };

    // ── 1. Table ──────────────────────────────────────────────────
    if (chartConfig.type === 'table' || chartId === 'table') {
      return { ...base, series: [], labels: [], xaxis: {} as ApexXAxis,
               columns: chartConfig.columns ?? [], tableData: data };
    }

    // ── 2. Gráficos no-axis: pie, donut, polarArea ────────────────
    if (this.NON_AXIS_TYPES.has(chartConfig.type)) {
      const segmentLabels = data.map(row => this.formatLabel(String(row[labelKey] ?? '')));
      const dataKey = chartConfig.series[0]?.dataKey ?? '';
      const values = data.map(row => {
        const v = row[dataKey];
        return v == null ? 0 : (parseFloat(String(v)) || 0);
      });
      return { ...base, series: values, labels: segmentLabels,
               xaxis: {} as ApexXAxis, columns: [], tableData: [] };
    }

    // ── 3. Scatter y bubble ───────────────────────────────────────
    if (chartConfig.type === 'scatter' || chartConfig.type === 'bubble') {
      const isBubble = chartConfig.type === 'bubble';
      const series = chartConfig.series.map(s => ({
        name: s.name,
        data: data.map(row => {
          const x = parseFloat(String(row[labelKey] ?? 0));
          const y = parseFloat(String(row[s.dataKey] ?? 0));
          if (isBubble && s.zKey) return { x, y, z: parseFloat(String(row[s.zKey] ?? 1)) };
          return { x, y };
        }),
      }));
      return { ...base, series, labels: [],
               xaxis: { ...chartConfig.xaxis, type: 'numeric' } as ApexXAxis,
               columns: [], tableData: [] };
    }

    // ── 4. Gráficos de eje: bar, line, area, radar, heatmap, mixed ─
    const xLabels = data.map(row => this.formatLabel(String(row[labelKey] ?? '')));
    const series = chartConfig.series.map(s => {
      const values: (number | null)[] = data.map(row => {
        const v = row[s.dataKey];
        if (v == null) return null;
        const n = parseFloat(String(v));
        return isNaN(n) ? null : n;
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const built: Record<string, any> = { name: s.name, data: values };
      if (s.type) built['type'] = s.type;
      return built;
    });

    return {
      ...base,
      series,
      labels: [],
      xaxis: { ...chartConfig.xaxis, categories: xLabels } as ApexXAxis,
      columns: [],
      tableData: [],
    };
  }

  private formatLabel(value: string): string {
    const trimmed = value.trim();
    const num = parseInt(trimmed, 10);
    if (!isNaN(num) && num >= 1 && num <= 12 && String(num) === trimmed) {
      const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
      return months[num - 1];
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        return `${d.toLocaleString('es-ES', { month: 'short' })} ${d.getFullYear()}`;
      }
    }
    return trimmed;
  }
}
