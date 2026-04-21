import { Component, ElementRef, ViewChild, AfterViewChecked, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  NgApexchartsModule,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexStroke,
  ApexFill,
  ApexTooltip,
  ApexDataLabels,
  ApexGrid,
  ApexLegend,
  ApexPlotOptions,
  ApexMarkers,
} from 'ng-apexcharts';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { SafeHtmlPipe } from '../../shared/pipe/safe-html.pipe';
import {
  ChatbotBiService,
  ChartColumn,
  ChartItemDTO,
  QueryRequestDTO,
  QueryResponseDTO,
  ThinkingEventData,
  SqlReadyEventData,
} from '../../shared/services/chatbot-bi.service';

// ── Interfaces ────────────────────────────────────────────────

interface ComputedChart {
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

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  typedText?: string;       // texto visible durante efecto de máquina de escribir
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

interface TableState {
  page: number;
  sortKey: string;
  sortAsc: boolean;
}

@Component({
  selector: 'app-ai-bi-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, PageBreadcrumbComponent, SafeHtmlPipe, NgApexchartsModule],
  templateUrl: './ai-bi-chat.component.html',
  styles: [`
    @keyframes aiBreath  { 0%,100%{transform:scale(1)}     50%{transform:scale(1.07)} }
    @keyframes btnPulse  { 0%{box-shadow:0 0 0 0 rgba(70,95,255,.55)} 70%{box-shadow:0 0 0 14px rgba(70,95,255,0)} 100%{box-shadow:0 0 0 0 rgba(70,95,255,0)} }
    @keyframes orbitA    { from{transform:rotate(0deg)}    to{transform:rotate(360deg)}  }
    @keyframes orbitB    { from{transform:rotate(0deg)}    to{transform:rotate(-360deg)} }
    @keyframes orbitC    { from{transform:rotate(60deg)}   to{transform:rotate(420deg)}  }
    @keyframes chatSlide { from{opacity:0;transform:translateY(14px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
    @keyframes dotJump   { 0%,60%,100%{transform:translateY(0);opacity:.55} 30%{transform:translateY(-5px);opacity:1} }
    @keyframes heroFloat { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-9px)} }
    @keyframes chartReveal { from{opacity:0;transform:translateY(22px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
    @keyframes msgReveal   { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    @keyframes stepIn      { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
    @keyframes spin        { to{transform:rotate(360deg)} }
    @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
    .ai-breathe  { animation: aiBreath    3s   ease-in-out  infinite }
    .btn-pulse   { animation: btnPulse    2s   ease-in-out  infinite }
    .orbit-a     { animation: orbitA      8s   linear       infinite; transform-origin:center }
    .orbit-b     { animation: orbitB     13s   linear       infinite; transform-origin:center }
    .orbit-c     { animation: orbitC     10s   linear       infinite; transform-origin:center }
    .chat-panel  { animation: chatSlide  .25s  cubic-bezier(.22,1,.36,1) }
    .dot-1       { animation: dotJump    1.4s  ease-in-out             infinite }
    .dot-2       { animation: dotJump    1.4s  ease-in-out  .2s        infinite }
    .dot-3       { animation: dotJump    1.4s  ease-in-out  .4s        infinite }
    .hero-float  { animation: heroFloat   5s   ease-in-out  infinite }
    .chart-in    { animation: chartReveal .55s cubic-bezier(.22,1,.36,1) both }
    .msg-in      { animation: msgReveal   .3s  ease-out both }
    .step-in     { animation: stepIn      .3s  ease-out }
    .spin        { animation: spin        1s   linear       infinite }
    .cursor::after { content:'▋'; display:inline-block; margin-left:1px; animation:cursorBlink .7s step-end infinite }
  `],
})
export class AiBiChatComponent implements AfterViewChecked, OnDestroy {
  @ViewChild('msgContainer') msgContainer!: ElementRef<HTMLDivElement>;
  private shouldScroll = false;
  private msgId = 2;
  private typewriterIntervals = new Map<number, ReturnType<typeof setInterval>>();

  // ── Chat state ────────────────────────────────────────────
  isChatOpen  = false;
  userMessage = '';
  isTyping    = false;

  // ── Live API state ────────────────────────────────────────
  hasRealData = false;
  currentCharts: ComputedChart[] = [];
  conversationCode: string | null = null;

  // ── Per-chart table state ─────────────────────────────────
  private tableStates = new Map<string, TableState>();

  messages: ChatMessage[] = [
    {
      id: 1, role: 'assistant',
      text: '¡Hola! Soy tu Asistente de Business Intelligence. Puedo analizar datos de ventas, ingresos y tendencias en lenguaje natural. ¿En qué puedo ayudarte?',
      timestamp: new Date(Date.now() - 5 * 60000),
    },
  ];

  sampleQueries = [
    '¿Cuáles son las ventas del mes?',
    'Muestra el top 5 productos',
    '¿Cuál es la tendencia de ingresos?',
    'Compara ventas por categoría',
    'Detección de anomalías recientes',
    '¿Qué categoría vende más?',
    'Comparar Q3 vs Q4 ingresos',
    'Tasa de retención de clientes',
    '¿Cuál es el ticket promedio?',
    'Tasa de conversión del funnel',
  ];

  icons = {
    chat:      `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"/></svg>`,
    send:      `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"/></svg>`,
    close:     `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>`,
    trendUp:   `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="size-3"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941"/></svg>`,
    trendDown: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="size-3"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 4.306 6.43l.776 2.898m0 0 3.182-5.511m-3.182 5.51-5.511-3.181"/></svg>`,
  };

  constructor(private readonly chatbotService: ChatbotBiService) {}

  // ── Chart helpers ─────────────────────────────────────────

  getChartTypeIcon(chartId: string): string {
    if (chartId === 'table')                                    return '📋';
    if (chartId === 'pie')                                      return '🥧';
    if (chartId === 'donut' || chartId === 'doughnut_kpi')      return '🍩';
    if (chartId === 'radar')                                    return '🕸️';
    if (chartId === 'scatter' || chartId === 'bubble')          return '⚪';
    if (chartId === 'polarArea')                                return '🌐';
    if (chartId === 'bar_line_mixed')                           return '📉';
    if (chartId.includes('line') || chartId === 'area_line' || chartId === 'stacked_area') return '📈';
    if (chartId.includes('bar'))                                return '📊';
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

  // ── Chart building ────────────────────────────────────────

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

  private readonly NON_AXIS_TYPES = new Set(['pie', 'donut', 'polarArea']);

  private buildChartFromItem(item: ChartItemDTO, data: Record<string, unknown>[]): ComputedChart {
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

  // ── Per-chart table helpers ───────────────────────────────

  private getTableState(chartId: string): TableState {
    if (!this.tableStates.has(chartId)) {
      this.tableStates.set(chartId, { page: 0, sortKey: '', sortAsc: true });
    }
    return this.tableStates.get(chartId)!;
  }

  getTablePage(chartId: string): number {
    return this.getTableState(chartId).page;
  }

  getTablePageCount(chart: ComputedChart): number {
    return Math.ceil(chart.tableData.length / 10);
  }

  getTableRows(chart: ComputedChart): Record<string, unknown>[] {
    const state = this.getTableState(chart.chartId);
    let rows = [...chart.tableData];
    if (state.sortKey) {
      rows = rows.sort((a, b) => {
        const av = a[state.sortKey];
        const bv = b[state.sortKey];
        const an = parseFloat(String(av ?? ''));
        const bn = parseFloat(String(bv ?? ''));
        const cmp = !isNaN(an) && !isNaN(bn) ? an - bn : String(av ?? '').localeCompare(String(bv ?? ''));
        return state.sortAsc ? cmp : -cmp;
      });
    }
    const start = state.page * 10;
    return rows.slice(start, start + 10);
  }

  toggleSort(chartId: string, key: string): void {
    const state = this.getTableState(chartId);
    if (state.sortKey === key) {
      state.sortAsc = !state.sortAsc;
    } else {
      state.sortKey = key;
      state.sortAsc = true;
    }
  }

  setTablePage(chartId: string, page: number): void {
    this.getTableState(chartId).page = page;
  }

  getSortIndicator(chartId: string, key: string): string {
    const state = this.getTableState(chartId);
    if (state.sortKey !== key) return '';
    return state.sortAsc ? '↑' : '↓';
  }

  formatTableCell(value: unknown, type: string): string {
    if (value == null) return '—';
    if (type === 'date') {
      const d = new Date(String(value));
      return isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('es-ES', { year: 'numeric', month: 'short' });
    }
    if (type === 'number') {
      const n = parseFloat(String(value));
      return isNaN(n) ? String(value) : n.toLocaleString('es-ES', { maximumFractionDigits: 2 });
    }
    return String(value);
  }

  // ── Chat methods ──────────────────────────────────────────

  toggleChat(): void {
    this.isChatOpen = !this.isChatOpen;
    if (this.isChatOpen) this.shouldScroll = true;
  }

  closeChat(): void {
    this.isChatOpen = false;
  }

  sendMessage(): void {
    const text = this.userMessage.trim();
    if (!text || this.isTyping) return;

    this.messages.push({ id: this.msgId++, role: 'user', text, timestamp: new Date() });
    this.userMessage  = '';
    this.isTyping     = true;
    this.shouldScroll = true;

    // Burbuja de "pensando" que se irá actualizando
    const thinkingMsgId = this.msgId++;
    this.messages.push({
      id: thinkingMsgId,
      role: 'assistant',
      text: '',
      timestamp: new Date(),
      isThinking: true,
      thinkingStep: 'Iniciando...',
    });

    const request: QueryRequestDTO = {
      query: text,
      ...(this.conversationCode ? { conversationCode: this.conversationCode } : {}),
    };

    this.chatbotService.queryStream(request).subscribe({
      next: (event) => {
        const thinking = this.messages.find(m => m.id === thinkingMsgId);

        if (event.event === 'thinking') {
          const d = event.data as ThinkingEventData;
          if (thinking) thinking.thinkingStep = d.message;
          this.shouldScroll = true;
        }

        if (event.event === 'sql_ready') {
          const d = event.data as SqlReadyEventData;
          if (thinking) thinking.thinkingStep = 'Ejecutando consulta en la base de datos...';
          // Mostrar el SQL generado en el chat como mensaje informativo
          const idx = this.messages.findIndex(m => m.id === thinkingMsgId);
          if (idx > -1) {
            this.messages.splice(idx, 0, {
              id: this.msgId++,
              role: 'assistant',
              text: d.sql,
              timestamp: new Date(),
              sqlGenerated: d.sql,
            });
          }
          this.shouldScroll = true;
        }

        if (event.event === 'complete') {
          const response = event.data as QueryResponseDTO;
          this.conversationCode = response.conversationCode;

          const charts = response.charts.map(item =>
            this.buildChartFromItem(item, response.data)
          );

          // Reemplazar la burbuja de thinking con la respuesta final
          const idx = this.messages.findIndex(m => m.id === thinkingMsgId);
          if (idx > -1) {
            this.messages[idx] = {
              id: thinkingMsgId,
              role: 'assistant',
              text: response.explanation,
              typedText: '',
              timestamp: new Date(),
              charts,
              recommendedChartIdx: response.recommendedChart,
              rowCount: response.rowCount,
              executionMs: response.executionMs,
              suggestedFollowUps: response.suggestedFollowUps,
            };
            // Efecto máquina de escribir para la explicación
            this.startTypewriter(thinkingMsgId, response.explanation);
          }

          this.isTyping     = false;
          this.shouldScroll = true;

          if (charts.length > 0) {
            this.hasRealData   = true;
            this.currentCharts = charts;
            this.tableStates.clear();
          }
        }

        if (event.event === 'error') {
          const d = event.data as { message: string };
          const idx = this.messages.findIndex(m => m.id === thinkingMsgId);
          if (idx > -1) {
            this.messages[idx] = {
              id: thinkingMsgId,
              role: 'assistant',
              text: d.message ?? 'Error al procesar la consulta. Por favor intenta de nuevo.',
              timestamp: new Date(),
            };
          }
          this.isTyping     = false;
          this.shouldScroll = true;
        }
      },
      error: (err) => {
        const msg = err?.message ?? 'Error al procesar la consulta. Por favor intenta de nuevo.';
        const idx = this.messages.findIndex(m => m.id === thinkingMsgId);
        if (idx > -1) {
          this.messages[idx] = { id: thinkingMsgId, role: 'assistant', text: msg, timestamp: new Date() };
        } else {
          this.messages.push({ id: this.msgId++, role: 'assistant', text: msg, timestamp: new Date() });
        }
        this.isTyping     = false;
        this.shouldScroll = true;
      },
    });
  }

  selectQuery(q: string): void {
    this.userMessage = q;
    this.isChatOpen  = true;
  }

  selectFollowUp(q: string): void {
    this.userMessage = q;
    this.sendMessage();
  }

  formatTime(d: Date): string {
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  // ── Typewriter effect ─────────────────────────────────────

  private startTypewriter(msgId: number, fullText: string): void {
    // Velocidad adaptativa: máx 3.5 s en total, entre 8 y 20 ms/char
    const speed = Math.max(8, Math.min(20, Math.floor(3500 / fullText.length)));
    let i = 0;
    const msg = this.messages.find(m => m.id === msgId);
    if (!msg) return;
    msg.typedText = '';

    const interval = setInterval(() => {
      const m = this.messages.find(x => x.id === msgId);
      if (!m) { clearInterval(interval); return; }
      if (i < fullText.length) {
        m.typedText = fullText.slice(0, ++i);
        this.shouldScroll = true;
      } else {
        m.typedText = fullText; // asegurar texto completo al final
        clearInterval(interval);
        this.typewriterIntervals.delete(msgId);
      }
    }, speed);

    this.typewriterIntervals.set(msgId, interval);
  }

  ngOnDestroy(): void {
    this.typewriterIntervals.forEach(interval => clearInterval(interval));
    this.typewriterIntervals.clear();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.msgContainer) {
      const el = this.msgContainer.nativeElement;
      el.scrollTop  = el.scrollHeight;
      this.shouldScroll = false;
    }
  }
}
