import { Component, OnDestroy } from '@angular/core';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import {
  ChatbotBiService,
  QueryRequestDTO,
  QueryResponseDTO,
  ThinkingEventData,
  SqlReadyEventData,
} from '../../shared/services/chatbot-bi.service';
import { ChartBuilderService } from './services/chart-builder.service';
import { ChatMessage, ComputedChart } from './models/chat.models';
import { ChatHeroBannerComponent } from './components/chat-hero-banner/chat-hero-banner.component';
import { ChatSampleQueriesComponent } from './components/chat-sample-queries/chat-sample-queries.component';
import { ChatEmptyStateComponent } from './components/chat-empty-state/chat-empty-state.component';
import { ChatChartsGridComponent } from './components/chat-charts-grid/chat-charts-grid.component';
import { ChatPanelComponent } from './components/chat-panel/chat-panel.component';

@Component({
  selector: 'app-ai-bi-chat',
  standalone: true,
  imports: [
    PageBreadcrumbComponent,
    ChatHeroBannerComponent,
    ChatSampleQueriesComponent,
    ChatEmptyStateComponent,
    ChatChartsGridComponent,
    ChatPanelComponent,
  ],
  templateUrl: './ai-bi-chat.component.html',
})
export class AiBiChatComponent implements OnDestroy {
  isChatOpen  = false;
  isTyping    = false;
  hasRealData = false;
  currentCharts: ComputedChart[] = [];
  conversationCode: string | null = null;
  prefillMessage = '';

  private msgId = 2;
  private typewriterIntervals = new Map<number, ReturnType<typeof setInterval>>();

  messages: ChatMessage[] = [
    {
      id: 1, role: 'assistant',
      text: '¡Hola! Soy tu Asistente de Business Intelligence. Puedo analizar datos de ventas, ingresos y tendencias en lenguaje natural. ¿En qué puedo ayudarte?',
      timestamp: new Date(Date.now() - 5 * 60000),
    },
  ];

  readonly sampleQueries = [
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

  constructor(
    private readonly chatbotService: ChatbotBiService,
    private readonly chartBuilder: ChartBuilderService,
  ) {}

  toggleChat(): void {
    this.isChatOpen = !this.isChatOpen;
  }

  onQuerySelected(query: string): void {
    this.prefillMessage = query;
    this.isChatOpen = true;
    // Reset prefill after a tick so ngOnChanges fires again on next selection
    setTimeout(() => { this.prefillMessage = ''; });
  }

  handleMessageSent(text: string): void {
    if (!text.trim() || this.isTyping) return;

    this.messages.push({ id: this.msgId++, role: 'user', text, timestamp: new Date() });
    this.isTyping = true;

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
        }

        if (event.event === 'sql_ready') {
          const d = event.data as SqlReadyEventData;
          if (thinking) thinking.thinkingStep = 'Ejecutando consulta en la base de datos...';
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
        }

        if (event.event === 'complete') {
          const response = event.data as QueryResponseDTO;
          this.conversationCode = response.conversationCode;
          const charts = response.charts.map(item =>
            this.chartBuilder.buildChartFromItem(item, response.data)
          );
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
            this.startTypewriter(thinkingMsgId, response.explanation);
          }
          this.isTyping = false;
          if (charts.length > 0) {
            this.hasRealData   = true;
            this.currentCharts = charts;
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
          this.isTyping = false;
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
        this.isTyping = false;
      },
    });
  }

  private startTypewriter(msgId: number, fullText: string): void {
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
      } else {
        m.typedText = fullText;
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
}
