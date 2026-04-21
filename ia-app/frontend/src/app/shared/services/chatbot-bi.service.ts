import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenStorageService } from './token-storage.service';

export interface QueryRequestDTO {
  query: string;
  conversationCode?: string;
}

/** Serie con dataKey — el frontend llena .data en tiempo de render */
export interface ApexSeriesDTO {
  name: string;
  dataKey: string;       // columna de data[] para el eje Y / valor
  data: never[];         // siempre [] — lo llena el frontend
  type?: string;         // solo gráficos mixtos: "bar" | "line"
  zKey?: string;         // solo bubble: columna de tamaño
}

export interface ChartColumn {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date';
}

/** Configuración ApexCharts nativa — mapea directamente a bindings de ng-apexcharts */
export interface ChartConfigDTO {
  type: string;
  title: string;
  description?: string;
  series: ApexSeriesDTO[];
  apexChart: Record<string, unknown>;
  xaxis: Record<string, unknown>;
  yaxis: Record<string, unknown> | Record<string, unknown>[];
  colors: string[];
  stroke: Record<string, unknown>;
  fill: Record<string, unknown>;
  dataLabels: Record<string, unknown>;
  plotOptions: Record<string, unknown>;
  grid: Record<string, unknown>;
  legend: Record<string, unknown>;
  tooltip: Record<string, unknown>;
  markers: Record<string, unknown>;
  columns?: ChartColumn[];
}

export interface ChartItemDTO {
  chartId: string;
  labelKey: string;
  chartConfig: ChartConfigDTO;
}

export interface QueryResponseDTO {
  conversationCode: string;
  messageCode: string;
  userQuery: string;
  sqlGenerated: string;
  explanation: string;
  data: Record<string, unknown>[];
  rowCount: number;
  executionMs: number;
  charts: ChartItemDTO[];
  recommendedChart: number;
  suggestedFollowUps: string[];
}

export type ChatStreamEventName = 'thinking' | 'sql_ready' | 'complete' | 'error';

export interface ThinkingEventData { step: string; message: string; }
export interface SqlReadyEventData  { sql: string; }
export interface ErrorEventData     { message: string; }

export interface ChatStreamEvent {
  event: ChatStreamEventName;
  data: ThinkingEventData | SqlReadyEventData | QueryResponseDTO | ErrorEventData;
}

@Injectable({ providedIn: 'root' })
export class ChatbotBiService {
  private readonly baseUrl = `${environment.apiUrl}/chatbot`;

  constructor(
    private readonly http: HttpClient,
    private readonly tokenStorage: TokenStorageService,
  ) {}

  query(request: QueryRequestDTO): Observable<QueryResponseDTO> {
    return this.http.post<QueryResponseDTO>(`${this.baseUrl}/query`, request);
  }

  queryStream(request: QueryRequestDTO): Observable<ChatStreamEvent> {
    const token = this.tokenStorage.getToken();
    const url   = `${this.baseUrl}/query-stream`;

    return new Observable<ChatStreamEvent>(observer => {
      const controller = new AbortController();

      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      })
        .then(async response => {
          if (!response.ok) {
            const err = await response.json().catch(() => ({ message: 'Error desconocido' }));
            observer.error(err);
            return;
          }

          const reader  = response.body!.getReader();
          const decoder = new TextDecoder();
          let buffer    = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) { observer.complete(); break; }

            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split('\n\n');
            buffer = parts.pop() ?? '';

            for (const part of parts) {
              if (!part.trim()) continue;

              let eventName = 'message';
              let dataStr   = '';

              for (const line of part.split('\n')) {
                if (line.startsWith('event: '))      eventName = line.slice(7).trim();
                else if (line.startsWith('data: '))  dataStr   = line.slice(6).trim();
              }

              if (dataStr) {
                try {
                  observer.next({
                    event: eventName as ChatStreamEventName,
                    data:  JSON.parse(dataStr),
                  });
                } catch { /* ignorar evento malformado */ }
              }
            }
          }
        })
        .catch(err => {
          if (err?.name !== 'AbortError') observer.error(err);
        });

      // Teardown: cancelar fetch si el Observable se desuscribe
      return () => controller.abort();
    });
  }
}
