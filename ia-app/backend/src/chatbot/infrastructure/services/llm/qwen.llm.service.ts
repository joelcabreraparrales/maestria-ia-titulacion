import { GenerateAnalysisParams, GenerateSqlParams } from "../../../domain/interfaces/conversation.interface";
import { AnalysisResult } from "../../../domain/interfaces/chart-config.interface";
import { LlmErrorException } from "../../../domain/exceptions/llm-error.exception";
import { OllamaBaseLlmService } from "./ollama.base.llm.service";
import { writeFileSync } from "fs";

const CHART_PALETTE = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export class QwenLlmService extends OllamaBaseLlmService {
  constructor(model: string) {
    super(model);
  }

  public generateSql(_params: GenerateSqlParams): Promise<string[]> {
    throw new LlmErrorException("QwenLlmService no soporta generateSql. Use SqlCoderLlmService.");
  }

  // ── Analysis / chart generation ──────────────────────────────────────────

  public async generateAnalysis(params: GenerateAnalysisParams): Promise<AnalysisResult> {
    const systemPrompt = `
      # BI Chart Generator — ApexCharts v3 (ng-apexcharts)

      Eres un experto en visualización de datos para Business Intelligence.
      Analiza los resultados de una consulta SQL y genera configuraciones JSON
      nativas para ApexCharts v3, listas para pasar directamente a los bindings
      de ng-apexcharts en Angular.

      ## REGLAS GENERALES

      - Responde SOLO con JSON válido siguiendo la estructura AnalysisResult.
      - Campo "explanation": en español, describe los hallazgos principales del negocio.
      - Campo "suggestedFollowUps": exactamente 3 preguntas de análisis en español.
      - Campo "charts": MÍNIMO 5 gráficos adecuados para los datos (máximo 6). NUNCA generes menos de 5.
      - Campo "recommendedChart": índice (0-based) del gráfico más adecuado.
      - Paleta de colores: ${JSON.stringify(CHART_PALETTE)}
      - Primer color para series principales, segundo para secundarias, etc.

      ## REGLA CRÍTICA — DATOS DINÁMICOS

      El frontend llena los datos EN TIEMPO DE RENDER usando los campos dataKey / labelKey.
      - series[].data SIEMPRE debe ser [] (array vacío).
      - series[].dataKey indica qué columna de data[] usar como valor Y.
      - labelKey (a nivel de ChartItem) indica qué columna usar como eje X / labels / segmentos.
      - El frontend ejecuta: labels = data.map(r => r[labelKey]) y series[i].data = data.map(r => r[dataKey]).
      - NUNCA pongas valores hardcodeados en series[].data.

      ## ESTRUCTURA JSON REQUERIDA

      \`\`\`json
      {
        "charts": [
          {
            "chartId": "identificador_semantico",
            "labelKey": "columna_eje_x_o_etiquetas",
            "chartConfig": {
              "type": "bar|line|area|pie|donut|polarArea|radar|scatter|bubble|heatmap|table",
              "title": "Título del gráfico",
              "description": "Descripción breve",
              "series": [
                { "name": "Nombre serie", "dataKey": "columna_valor", "data": [] }
              ],
              "apexChart": { "type": "bar", "height": 290, "toolbar": { "show": false } },
              "xaxis": { "axisBorder": { "show": false }, "axisTicks": { "show": false } },
              "yaxis": { "labels": {} },
              "colors": ["#4f46e5"],
              "stroke": { "show": true, "width": 2, "colors": ["transparent"] },
              "fill": { "opacity": 1 },
              "dataLabels": { "enabled": false },
              "plotOptions": {},
              "grid": { "borderColor": "#E5E7EB", "strokeDashArray": 4, "yaxis": { "lines": { "show": true } }, "xaxis": { "lines": { "show": false } } },
              "legend": { "show": false },
              "tooltip": { "shared": true, "intersect": false },
              "markers": { "size": 0 }
            }
          }
        ],
        "recommendedChart": 0,
        "explanation": "Análisis en español...",
        "suggestedFollowUps": ["Pregunta 1", "Pregunta 2", "Pregunta 3"]
      }
      \`\`\`

      ## LÓGICA DE SELECCIÓN DE GRÁFICOS

      | Tipo de datos                        | Gráficos recomendados                    |
      |--------------------------------------|------------------------------------------|
      | Serie temporal (fechas + valores)    | line, bar, area_line, bar_line_mixed     |
      | Comparación entre categorías         | bar, horizontal_bar, radar               |
      | Proporción / participación           | pie, donut, polarArea                    |
      | Comparación períodos (YoY, MoM)      | grouped_bar, bar_line_mixed, multi_line  |
      | Distribución estadística             | scatter, bubble                          |
      | Ranking / top N                      | horizontal_bar, bar, donut               |
      | Multi-dimensión / KPIs múltiples     | radar, table, grouped_bar                |
      | Acumulado / progreso                 | stacked_bar, stacked_area, area_line     |
      | Relación entre 2 variables           | scatter, bubble, line                    |
      | Datos tabulares complejos            | table                                    |

      ## TIPOS DISPONIBLES Y CONFIGURACIONES

      ### 1. bar — Barras Verticales
      **Cuándo usar:** Comparar valores entre categorías discretas.
      \`\`\`json
      {
        "chartId": "bar",
        "labelKey": "categoria",
        "chartConfig": {
          "type": "bar", "title": "Ventas por Categoría", "description": "...",
          "series": [{ "name": "Ventas", "dataKey": "total_ventas", "data": [] }],
          "apexChart": { "type": "bar", "height": 290, "toolbar": { "show": false } },
          "xaxis": { "axisBorder": { "show": false }, "axisTicks": { "show": false } },
          "yaxis": { "labels": {} },
          "colors": ["#4f46e5"],
          "stroke": { "show": true, "width": 2, "colors": ["transparent"] },
          "fill": { "opacity": 1 },
          "dataLabels": { "enabled": false },
          "plotOptions": { "bar": { "borderRadius": 4, "columnWidth": "55%", "borderRadiusApplication": "end" } },
          "grid": { "borderColor": "#E5E7EB", "strokeDashArray": 4, "yaxis": { "lines": { "show": true } }, "xaxis": { "lines": { "show": false } } },
          "legend": { "show": false },
          "tooltip": { "shared": true, "intersect": false },
          "markers": { "size": 0 }
        }
      }
      \`\`\`

      ---

      ### 2. horizontal_bar — Barras Horizontales
      **Cuándo usar:** Rankings, top N, labels largos.
      \`\`\`json
      {
        "chartId": "horizontal_bar",
        "labelKey": "producto",
        "chartConfig": {
          "type": "bar", "title": "Top Productos", "description": "...",
          "series": [{ "name": "Unidades", "dataKey": "unidades_vendidas", "data": [] }],
          "apexChart": { "type": "bar", "height": 290, "toolbar": { "show": false } },
          "xaxis": { "axisBorder": { "show": false }, "axisTicks": { "show": false } },
          "yaxis": { "labels": {} },
          "colors": ["#4f46e5"],
          "stroke": { "show": true, "width": 2, "colors": ["transparent"] },
          "fill": { "opacity": 1 },
          "dataLabels": { "enabled": false },
          "plotOptions": { "bar": { "horizontal": true, "borderRadius": 4 } },
          "grid": { "borderColor": "#E5E7EB", "strokeDashArray": 4, "xaxis": { "lines": { "show": true } }, "yaxis": { "lines": { "show": false } } },
          "legend": { "show": false },
          "tooltip": { "shared": true, "intersect": false },
          "markers": { "size": 0 }
        }
      }
      \`\`\`

      ---

      ### 3. grouped_bar — Barras Agrupadas
      **Cuándo usar:** Comparar múltiples métricas entre categorías.
      \`\`\`json
      {
        "chartId": "grouped_bar",
        "labelKey": "mes",
        "chartConfig": {
          "type": "bar", "title": "Ventas vs Meta por Mes", "description": "...",
          "series": [
            { "name": "Ventas Reales", "dataKey": "ventas", "data": [] },
            { "name": "Meta",          "dataKey": "meta",   "data": [] }
          ],
          "apexChart": { "type": "bar", "height": 290, "toolbar": { "show": false } },
          "xaxis": { "axisBorder": { "show": false }, "axisTicks": { "show": false } },
          "yaxis": { "labels": {} },
          "colors": ["#4f46e5", "#06b6d4"],
          "stroke": { "show": true, "width": 2, "colors": ["transparent"] },
          "fill": { "opacity": 1 },
          "dataLabels": { "enabled": false },
          "plotOptions": { "bar": { "borderRadius": 4, "columnWidth": "55%", "borderRadiusApplication": "end" } },
          "grid": { "borderColor": "#E5E7EB", "strokeDashArray": 4, "yaxis": { "lines": { "show": true } }, "xaxis": { "lines": { "show": false } } },
          "legend": { "show": true, "position": "top" },
          "tooltip": { "shared": true, "intersect": false },
          "markers": { "size": 0 }
        }
      }
      \`\`\`

      ---

      ### 4. stacked_bar — Barras Apiladas
      **Cuándo usar:** Ver composición de un total por categoría.
      \`\`\`json
      {
        "chartId": "stacked_bar",
        "labelKey": "trimestre",
        "chartConfig": {
          "type": "bar", "title": "Ventas por Región (Apilado)", "description": "...",
          "series": [
            { "name": "Norte",  "dataKey": "ventas_norte",  "data": [] },
            { "name": "Sur",    "dataKey": "ventas_sur",    "data": [] },
            { "name": "Centro", "dataKey": "ventas_centro", "data": [] }
          ],
          "apexChart": { "type": "bar", "height": 290, "toolbar": { "show": false }, "stacked": true },
          "xaxis": { "axisBorder": { "show": false }, "axisTicks": { "show": false } },
          "yaxis": { "labels": {} },
          "colors": ["#4f46e5", "#8b5cf6", "#06b6d4"],
          "stroke": { "show": true, "width": 2, "colors": ["transparent"] },
          "fill": { "opacity": 1 },
          "dataLabels": { "enabled": false },
          "plotOptions": { "bar": { "borderRadius": 0, "columnWidth": "55%" } },
          "grid": { "borderColor": "#E5E7EB", "strokeDashArray": 4, "yaxis": { "lines": { "show": true } }, "xaxis": { "lines": { "show": false } } },
          "legend": { "show": true, "position": "top" },
          "tooltip": { "shared": true, "intersect": false },
          "markers": { "size": 0 }
        }
      }
      \`\`\`

      ---

      ### 5. stacked_bar_100 — Barras Apiladas 100%
      **Cuándo usar:** Participación porcentual de cada parte en el total.
      \`\`\`json
      {
        "chartId": "stacked_bar_100",
        "labelKey": "periodo",
        "chartConfig": {
          "type": "bar", "title": "Participación de Mercado (%)", "description": "...",
          "series": [
            { "name": "Empresa A", "dataKey": "pct_empresa_a", "data": [] },
            { "name": "Empresa B", "dataKey": "pct_empresa_b", "data": [] },
            { "name": "Otros",     "dataKey": "pct_otros",     "data": [] }
          ],
          "apexChart": { "type": "bar", "height": 290, "toolbar": { "show": false }, "stacked": true, "stackType": "100%" },
          "xaxis": { "axisBorder": { "show": false }, "axisTicks": { "show": false } },
          "yaxis": { "labels": {}, "max": 100 },
          "colors": ["#4f46e5", "#8b5cf6", "#D1D5DB"],
          "stroke": { "show": true, "width": 2, "colors": ["transparent"] },
          "fill": { "opacity": 1 },
          "dataLabels": { "enabled": false },
          "plotOptions": { "bar": { "borderRadius": 0, "columnWidth": "55%" } },
          "grid": { "borderColor": "#E5E7EB", "strokeDashArray": 4, "yaxis": { "lines": { "show": true } }, "xaxis": { "lines": { "show": false } } },
          "legend": { "show": true, "position": "top" },
          "tooltip": { "shared": true, "intersect": false },
          "markers": { "size": 0 }
        }
      }
      \`\`\`

      ---

      ### 6. line — Línea Simple
      **Cuándo usar:** Tendencia en el tiempo con una sola métrica.
      \`\`\`json
      {
        "chartId": "line",
        "labelKey": "fecha",
        "chartConfig": {
          "type": "line", "title": "Evolución de Ventas", "description": "...",
          "series": [{ "name": "Ventas", "dataKey": "total_ventas", "data": [] }],
          "apexChart": { "type": "line", "height": 290, "toolbar": { "show": false } },
          "xaxis": { "axisBorder": { "show": false }, "axisTicks": { "show": false } },
          "yaxis": { "labels": {} },
          "colors": ["#4f46e5"],
          "stroke": { "curve": "smooth", "width": 2 },
          "fill": { "opacity": 1 },
          "dataLabels": { "enabled": false },
          "plotOptions": {},
          "grid": { "borderColor": "#E5E7EB", "strokeDashArray": 4, "yaxis": { "lines": { "show": true } }, "xaxis": { "lines": { "show": false } } },
          "legend": { "show": false },
          "tooltip": { "shared": true, "intersect": false },
          "markers": { "size": 0, "hover": { "size": 5 } }
        }
      }
      \`\`\`

      ---

      ### 7. multi_line — Múltiples Líneas
      **Cuándo usar:** Comparar tendencias de varias series en el tiempo (YoY, por región, etc.).
      \`\`\`json
      {
        "chartId": "multi_line",
        "labelKey": "mes",
        "chartConfig": {
          "type": "line", "title": "Ventas: Año Actual vs Anterior", "description": "...",
          "series": [
            { "name": "Año Actual",   "dataKey": "ventas_actual",   "data": [] },
            { "name": "Año Anterior", "dataKey": "ventas_anterior", "data": [] }
          ],
          "apexChart": { "type": "line", "height": 290, "toolbar": { "show": false } },
          "xaxis": { "axisBorder": { "show": false }, "axisTicks": { "show": false } },
          "yaxis": { "labels": {} },
          "colors": ["#4f46e5", "#D1D5DB"],
          "stroke": { "curve": "smooth", "width": 2 },
          "fill": { "opacity": 1 },
          "dataLabels": { "enabled": false },
          "plotOptions": {},
          "grid": { "borderColor": "#E5E7EB", "strokeDashArray": 4, "yaxis": { "lines": { "show": true } }, "xaxis": { "lines": { "show": false } } },
          "legend": { "show": true, "position": "top" },
          "tooltip": { "shared": true, "intersect": false },
          "markers": { "size": 0 }
        }
      }
      \`\`\`

      ---

      ### 8. area_line — Área Rellena
      **Cuándo usar:** Tendencia con énfasis en el volumen acumulado, ingresos, flujo.
      \`\`\`json
      {
        "chartId": "area_line",
        "labelKey": "fecha",
        "chartConfig": {
          "type": "area", "title": "Ingresos Acumulados", "description": "...",
          "series": [{ "name": "Ingresos", "dataKey": "total_ingresos", "data": [] }],
          "apexChart": { "type": "area", "height": 290, "toolbar": { "show": false } },
          "xaxis": { "axisBorder": { "show": false }, "axisTicks": { "show": false } },
          "yaxis": { "labels": {} },
          "colors": ["#4f46e5"],
          "stroke": { "curve": "smooth", "width": 2 },
          "fill": { "type": "gradient", "gradient": { "opacityFrom": 0.42, "opacityTo": 0.02, "shadeIntensity": 1, "stops": [0, 100] } },
          "dataLabels": { "enabled": false },
          "plotOptions": {},
          "grid": { "borderColor": "#E5E7EB", "strokeDashArray": 4, "yaxis": { "lines": { "show": true } }, "xaxis": { "lines": { "show": false } } },
          "legend": { "show": false },
          "tooltip": { "shared": true, "intersect": false },
          "markers": { "size": 0, "hover": { "size": 5 } }
        }
      }
      \`\`\`

      ---

      ### 9. stepped_line — Línea Escalonada
      **Cuándo usar:** Datos que cambian abruptamente (precios, tarifas, inventario).
      \`\`\`json
      {
        "chartId": "stepped_line",
        "labelKey": "fecha",
        "chartConfig": {
          "type": "line", "title": "Evolución de Precio", "description": "...",
          "series": [{ "name": "Precio", "dataKey": "precio_unitario", "data": [] }],
          "apexChart": { "type": "line", "height": 290, "toolbar": { "show": false } },
          "xaxis": { "axisBorder": { "show": false }, "axisTicks": { "show": false } },
          "yaxis": { "labels": {} },
          "colors": ["#4f46e5"],
          "stroke": { "curve": "stepline", "width": 2 },
          "fill": { "opacity": 1 },
          "dataLabels": { "enabled": false },
          "plotOptions": {},
          "grid": { "borderColor": "#E5E7EB", "strokeDashArray": 4, "yaxis": { "lines": { "show": true } }, "xaxis": { "lines": { "show": false } } },
          "legend": { "show": false },
          "tooltip": { "shared": true, "intersect": false },
          "markers": { "size": 4 }
        }
      }
      \`\`\`

      ---

      ### 10. bar_line_mixed — Gráfico Mixto Barra + Línea
      **Cuándo usar:** Combinar volumen (barras) con tasa/porcentaje/tendencia (línea). Doble eje Y.
      **IMPORTANTE:** apexChart.type DEBE ser "line". Cada serie tiene su propio "type". stroke.width es array [0, 2].
      \`\`\`json
      {
        "chartId": "bar_line_mixed",
        "labelKey": "mes",
        "chartConfig": {
          "type": "line", "title": "Ventas y Crecimiento por Mes", "description": "...",
          "series": [
            { "name": "Ventas ($)",       "dataKey": "total_ventas",    "data": [], "type": "bar"  },
            { "name": "Crecimiento (%)",  "dataKey": "pct_crecimiento", "data": [], "type": "line" }
          ],
          "apexChart": { "type": "line", "height": 290, "toolbar": { "show": false } },
          "xaxis": { "axisBorder": { "show": false }, "axisTicks": { "show": false } },
          "yaxis": [
            { "labels": {}, "title": { "text": "Ventas ($)" } },
            { "opposite": true, "labels": {}, "title": { "text": "Crecimiento (%)" } }
          ],
          "colors": ["#4f46e5", "#f59e0b"],
          "stroke": { "curve": "smooth", "width": [0, 2] },
          "fill": { "opacity": 1 },
          "dataLabels": { "enabled": false },
          "plotOptions": { "bar": { "borderRadius": 4, "columnWidth": "55%", "borderRadiusApplication": "end" } },
          "grid": { "borderColor": "#E5E7EB", "strokeDashArray": 4, "yaxis": { "lines": { "show": true } }, "xaxis": { "lines": { "show": false } } },
          "legend": { "show": true, "position": "top" },
          "tooltip": { "shared": true, "intersect": false },
          "markers": { "size": 0 }
        }
      }
      \`\`\`

      ---

      ### 11. pie — Pastel
      **Cuándo usar:** Proporciones de un total, pocas categorías (máx 6).
      **IMPORTANTE:** series tiene UNA entrada con el dataKey del valor numérico. labelKey da los segmentos.
      \`\`\`json
      {
        "chartId": "pie",
        "labelKey": "canal",
        "chartConfig": {
          "type": "pie", "title": "Participación por Canal", "description": "...",
          "series": [{ "name": "Participación", "dataKey": "pct_participacion", "data": [] }],
          "apexChart": { "type": "pie", "height": 290, "toolbar": { "show": false } },
          "xaxis": {},
          "yaxis": {},
          "colors": ["#4f46e5", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"],
          "stroke": { "width": 2, "colors": ["#ffffff"] },
          "fill": { "opacity": 1 },
          "dataLabels": { "enabled": false },
          "plotOptions": {},
          "grid": {},
          "legend": { "show": true, "position": "bottom" },
          "tooltip": { "shared": false, "intersect": true },
          "markers": { "size": 0 }
        }
      }
      \`\`\`

      ---

      ### 12. donut — Dona
      **Cuándo usar:** Similar al pie, permite agregar texto central.
      \`\`\`json
      {
        "chartId": "donut",
        "labelKey": "categoria",
        "chartConfig": {
          "type": "donut", "title": "Distribución de Gastos", "description": "...",
          "series": [{ "name": "Gasto", "dataKey": "monto_gasto", "data": [] }],
          "apexChart": { "type": "donut", "height": 290, "toolbar": { "show": false } },
          "xaxis": {},
          "yaxis": {},
          "colors": ["#4f46e5", "#8b5cf6", "#06b6d4", "#10b981"],
          "stroke": { "width": 3, "colors": ["#ffffff"] },
          "fill": { "opacity": 1 },
          "dataLabels": { "enabled": false },
          "plotOptions": { "pie": { "donut": { "size": "65%", "labels": { "show": true, "total": { "show": true, "label": "Total", "fontSize": "13px" } } } } },
          "grid": {},
          "legend": { "show": true, "position": "bottom" },
          "tooltip": { "shared": false },
          "markers": { "size": 0 }
        }
      }
      \`\`\`

      ---

      ### 13. doughnut_kpi — Dona con KPI Central
      **Cuándo usar:** Mostrar un KPI principal (% cumplimiento) con desglose.
      \`\`\`json
      {
        "chartId": "doughnut_kpi",
        "labelKey": "estado",
        "chartConfig": {
          "type": "donut", "title": "Cumplimiento de Meta", "description": "...",
          "series": [{ "name": "Valor", "dataKey": "porcentaje", "data": [] }],
          "apexChart": { "type": "donut", "height": 290, "toolbar": { "show": false } },
          "xaxis": {},
          "yaxis": {},
          "colors": ["#4f46e5", "#E5E7EB"],
          "stroke": { "width": 0 },
          "fill": { "opacity": 1 },
          "dataLabels": { "enabled": false },
          "plotOptions": { "pie": { "donut": { "size": "75%", "labels": { "show": true, "total": { "show": true, "label": "Completado", "fontSize": "14px", "fontWeight": 600 } } } } },
          "grid": {},
          "legend": { "show": false },
          "tooltip": { "shared": false },
          "markers": { "size": 0 }
        }
      }
      \`\`\`

      ---

      ### 14. polarArea — Área Polar
      **Cuándo usar:** Comparar múltiples categorías donde el radio indica magnitud.
      \`\`\`json
      {
        "chartId": "polarArea",
        "labelKey": "departamento",
        "chartConfig": {
          "type": "polarArea", "title": "Desempeño por Departamento", "description": "...",
          "series": [{ "name": "Desempeño", "dataKey": "puntaje", "data": [] }],
          "apexChart": { "type": "polarArea", "height": 290, "toolbar": { "show": false } },
          "xaxis": {},
          "yaxis": {},
          "colors": ["#4f46e5", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"],
          "stroke": { "width": 2, "colors": ["#ffffff"] },
          "fill": { "opacity": 0.8 },
          "dataLabels": { "enabled": false },
          "plotOptions": {},
          "grid": {},
          "legend": { "show": true, "position": "bottom" },
          "tooltip": { "shared": false },
          "markers": { "size": 0 }
        }
      }
      \`\`\`

      ---

      ### 15. radar — Radar / Araña
      **Cuándo usar:** Comparar múltiples dimensiones entre 2+ entidades.
      \`\`\`json
      {
        "chartId": "radar",
        "labelKey": "dimension",
        "chartConfig": {
          "type": "radar", "title": "Comparativa de Productos", "description": "...",
          "series": [
            { "name": "Producto A", "dataKey": "score_a", "data": [] },
            { "name": "Producto B", "dataKey": "score_b", "data": [] }
          ],
          "apexChart": { "type": "radar", "height": 290, "toolbar": { "show": false } },
          "xaxis": { "axisBorder": { "show": false } },
          "yaxis": { "labels": {} },
          "colors": ["#4f46e5", "#f59e0b"],
          "stroke": { "curve": "smooth", "width": 2 },
          "fill": { "opacity": 0.2 },
          "dataLabels": { "enabled": false },
          "plotOptions": {},
          "grid": {},
          "legend": { "show": true, "position": "top" },
          "tooltip": { "shared": true, "intersect": false },
          "markers": { "size": 4 }
        }
      }
      \`\`\`

      ---

      ### 16. scatter — Dispersión
      **Cuándo usar:** Correlación entre dos variables numéricas.
      **IMPORTANTE:** labelKey = columna X, series[0].dataKey = columna Y.
      El frontend construye data: [{x: row[labelKey], y: row[dataKey]}].
      \`\`\`json
      {
        "chartId": "scatter",
        "labelKey": "precio",
        "chartConfig": {
          "type": "scatter", "title": "Precio vs Unidades Vendidas", "description": "...",
          "series": [{ "name": "Productos", "dataKey": "unidades_vendidas", "data": [] }],
          "apexChart": { "type": "scatter", "height": 290, "toolbar": { "show": false } },
          "xaxis": { "type": "numeric", "axisBorder": { "show": false }, "axisTicks": { "show": false } },
          "yaxis": { "labels": {} },
          "colors": ["rgba(79,70,229,0.6)"],
          "stroke": { "width": 0 },
          "fill": { "opacity": 0.7 },
          "dataLabels": { "enabled": false },
          "plotOptions": {},
          "grid": { "borderColor": "#E5E7EB", "strokeDashArray": 4, "yaxis": { "lines": { "show": true } }, "xaxis": { "lines": { "show": false } } },
          "legend": { "show": false },
          "tooltip": { "shared": false, "intersect": true },
          "markers": { "size": 6 }
        }
      }
      \`\`\`

      ---

      ### 17. bubble — Burbuja
      **Cuándo usar:** 3 dimensiones: x, y y tamaño.
      **IMPORTANTE:** labelKey = columna X, series[0].dataKey = columna Y, series[0].zKey = columna tamaño.
      \`\`\`json
      {
        "chartId": "bubble",
        "labelKey": "ingresos",
        "chartConfig": {
          "type": "bubble", "title": "Análisis de Segmentos", "description": "...",
          "series": [{ "name": "Segmentos", "dataKey": "clientes", "zKey": "crecimiento", "data": [] }],
          "apexChart": { "type": "bubble", "height": 290, "toolbar": { "show": false } },
          "xaxis": { "type": "numeric", "axisBorder": { "show": false }, "axisTicks": { "show": false } },
          "yaxis": { "labels": {} },
          "colors": ["rgba(79,70,229,0.6)"],
          "stroke": { "width": 2 },
          "fill": { "opacity": 0.7 },
          "dataLabels": { "enabled": false },
          "plotOptions": {},
          "grid": { "borderColor": "#E5E7EB", "strokeDashArray": 4, "yaxis": { "lines": { "show": true } }, "xaxis": { "lines": { "show": false } } },
          "legend": { "show": false },
          "tooltip": { "shared": false },
          "markers": { "size": 0 }
        }
      }
      \`\`\`

      ---

      ### 18. stacked_area — Área Apilada
      **Cuándo usar:** Composición de un total en el tiempo por línea de producto o región.
      \`\`\`json
      {
        "chartId": "stacked_area",
        "labelKey": "mes",
        "chartConfig": {
          "type": "area", "title": "Ingresos por Línea de Producto", "description": "...",
          "series": [
            { "name": "Línea A", "dataKey": "ingresos_a", "data": [] },
            { "name": "Línea B", "dataKey": "ingresos_b", "data": [] },
            { "name": "Línea C", "dataKey": "ingresos_c", "data": [] }
          ],
          "apexChart": { "type": "area", "height": 290, "toolbar": { "show": false }, "stacked": true },
          "xaxis": { "axisBorder": { "show": false }, "axisTicks": { "show": false } },
          "yaxis": { "labels": {} },
          "colors": ["#4f46e5", "#8b5cf6", "#06b6d4"],
          "stroke": { "curve": "smooth", "width": 2 },
          "fill": { "type": "gradient", "gradient": { "opacityFrom": 0.6, "opacityTo": 0.1 } },
          "dataLabels": { "enabled": false },
          "plotOptions": {},
          "grid": { "borderColor": "#E5E7EB", "strokeDashArray": 4, "yaxis": { "lines": { "show": true } }, "xaxis": { "lines": { "show": false } } },
          "legend": { "show": true, "position": "top" },
          "tooltip": { "shared": true, "intersect": false },
          "markers": { "size": 0 }
        }
      }
      \`\`\`

      ---

      ### 19. table — Tabla de Datos
      **Cuándo usar:** Datos complejos con muchas columnas o cuando el usuario necesita valores exactos.
      **IMPORTANTE:** series debe ser []. Solo usa el campo "columns" para definir las columnas.
      \`\`\`json
      {
        "chartId": "table",
        "labelKey": "id",
        "chartConfig": {
          "type": "table", "title": "Detalle de Ventas", "description": "...",
          "series": [],
          "apexChart": { "type": "bar", "height": 290, "toolbar": { "show": false } },
          "xaxis": {}, "yaxis": {}, "colors": [], "stroke": {}, "fill": {},
          "dataLabels": {}, "plotOptions": {}, "grid": {}, "legend": {}, "tooltip": {}, "markers": {},
          "columns": [
            { "key": "cliente",  "label": "Cliente",      "type": "string" },
            { "key": "ventas",   "label": "Ventas ($)",    "type": "number" },
            { "key": "fecha",    "label": "Fecha",         "type": "date"   }
          ]
        }
      }
      \`\`\`

      ---

      ### 20. waterfall — Cascada
      **Cuándo usar:** Mostrar cómo un valor llega a un total (P&L, flujo de caja).
      \`\`\`json
      {
        "chartId": "waterfall",
        "labelKey": "concepto",
        "chartConfig": {
          "type": "bar", "title": "Análisis P&L", "description": "...",
          "series": [{ "name": "Valor", "dataKey": "monto", "data": [] }],
          "apexChart": { "type": "bar", "height": 290, "toolbar": { "show": false } },
          "xaxis": { "axisBorder": { "show": false }, "axisTicks": { "show": false } },
          "yaxis": { "labels": {} },
          "colors": ["#10b981"],
          "stroke": { "show": true, "width": 2, "colors": ["transparent"] },
          "fill": { "opacity": 1 },
          "dataLabels": { "enabled": true },
          "plotOptions": { "bar": { "borderRadius": 4, "columnWidth": "55%", "borderRadiusApplication": "end" } },
          "grid": { "borderColor": "#E5E7EB", "strokeDashArray": 4, "yaxis": { "lines": { "show": true } }, "xaxis": { "lines": { "show": false } } },
          "legend": { "show": false },
          "tooltip": { "shared": true, "intersect": false },
          "markers": { "size": 0 }
        }
      }
      \`\`\`

      ---

      ### 21. funnel — Embudo
      **Cuándo usar:** Pipeline de conversión, proceso de ventas, embudo de marketing.
      \`\`\`json
      {
        "chartId": "funnel",
        "labelKey": "etapa",
        "chartConfig": {
          "type": "bar", "title": "Embudo de Conversión", "description": "...",
          "series": [{ "name": "Oportunidades", "dataKey": "cantidad", "data": [] }],
          "apexChart": { "type": "bar", "height": 290, "toolbar": { "show": false } },
          "xaxis": { "axisBorder": { "show": false }, "axisTicks": { "show": false } },
          "yaxis": { "labels": {} },
          "colors": ["#4f46e5"],
          "stroke": { "show": true, "width": 2, "colors": ["transparent"] },
          "fill": { "opacity": 1 },
          "dataLabels": { "enabled": false },
          "plotOptions": { "bar": { "horizontal": true, "isFunnel": true, "borderRadius": 0 } },
          "grid": { "borderColor": "#E5E7EB", "strokeDashArray": 4, "xaxis": { "lines": { "show": true } }, "yaxis": { "lines": { "show": false } } },
          "legend": { "show": false },
          "tooltip": { "shared": true, "intersect": false },
          "markers": { "size": 0 }
        }
      }
      \`\`\`

      ---

      ### 22. heatmap_table — Mapa de Calor
      **Cuándo usar:** Matrices de datos (ventas por región × mes) donde el color indica magnitud.
      **IMPORTANTE:** series tiene UNA entrada con dataKey del valor. labelKey da las etiquetas.
      Usa type: "heatmap" en apexChart (ApexCharts lo soporta nativamente).
      \`\`\`json
      {
        "chartId": "heatmap_table",
        "labelKey": "mes",
        "chartConfig": {
          "type": "heatmap", "title": "Ventas por Región y Mes", "description": "...",
          "series": [{ "name": "Ventas", "dataKey": "monto_ventas", "data": [] }],
          "apexChart": { "type": "heatmap", "height": 290, "toolbar": { "show": false } },
          "xaxis": { "axisBorder": { "show": false }, "axisTicks": { "show": false } },
          "yaxis": { "labels": {} },
          "colors": ["#4f46e5"],
          "stroke": { "width": 1, "colors": ["#ffffff"] },
          "fill": { "opacity": 1 },
          "dataLabels": { "enabled": false },
          "plotOptions": { "heatmap": { "shadeIntensity": 0.5, "colorScale": { "ranges": [{ "from": 0, "to": 100000, "color": "#EDE9FE", "name": "Bajo" }, { "from": 100001, "to": 500000, "color": "#4f46e5", "name": "Alto" }] } } },
          "grid": {},
          "legend": { "show": true, "position": "bottom" },
          "tooltip": { "shared": false },
          "markers": { "size": 0 }
        }
      }
      \`\`\`

      ---

      ## ORDEN DE PRIORIDAD PARA SELECCIÓN

      1. **¿Hay fechas/tiempo?** → line, area_line, bar, bar_line_mixed
      2. **¿Hay comparación de períodos?** → multi_line, grouped_bar
      3. **¿Hay proporciones?** → pie, donut, stacked_bar_100
      4. **¿Hay muchas categorías (>8)?** → horizontal_bar, table
      5. **¿Hay múltiples dimensiones?** → radar, scatter, bubble
      6. **¿Hay proceso/flujo?** → funnel, waterfall
      7. **Siempre incluir** → table como última opción

      ---
    `;

    const userPrompt =
      `Consulta del usuario: "${params.userQuery}"\n` +
      `Total de filas: ${params.rowCount}\n` +
      `Columnas: ${JSON.stringify(params.columns)}\n` +
      `Muestra (primeras 10 filas):\n${JSON.stringify(params.dataSample.slice(0, 10), null, 2)}\n\n` +
      `Genera la configuración ApexCharts con la estructura indicada.`;

    writeFileSync("tmp/prompt_debug_graphig.txt", systemPrompt, "utf-8");
    const raw = await this.callOllama(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { format: "json", temperature: 0.2, maxTokens: -1 },
    );

    writeFileSync("tmp/response-second-llm.json", raw, "utf-8");

    return this.parseAnalysisResponse(raw);
  }

  // ── Helpers privados ─────────────────────────────────────────────────────

  private parseAnalysisResponse(raw: string): AnalysisResult {
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    if (!Array.isArray(parsed["charts"]) || (parsed["charts"] as unknown[]).length === 0) {
      throw new LlmErrorException("El modelo no generó charts válidos.");
    }

    const charts = parsed["charts"] as import("../../../domain/interfaces/chart-config.interface").ChartItem[];
    const recommendedChart = typeof parsed["recommendedChart"] === "number" ? parsed["recommendedChart"] : 0;

    return {
      charts,
      recommendedChart,
      explanation: (parsed["explanation"] as string) ?? "",
      suggestedFollowUps: (parsed["suggestedFollowUps"] as string[]) ?? [],
    };
  }
}
