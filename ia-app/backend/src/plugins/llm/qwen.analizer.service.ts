import { writeFileSync } from "fs";
import { LlmService } from "./llm.service";
import { LlmAnalizerService } from "./llm.analizer.service";
import { LlmErrorException } from "../../chatbot/domain/exceptions/llm-error.exception";
import { GenerateAnalysisParams } from "../../chatbot/domain/interfaces/conversation.interface";
import { AnalysisResult, ChartItem } from "../../chatbot/domain/interfaces/chart-config.interface";

export class QwenAnalizer extends LlmAnalizerService {
  private readonly CHART_PALETTE = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  constructor(private readonly llm: LlmService) {
    super();
  }

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
      - Paleta de colores: ${JSON.stringify(this.CHART_PALETTE)}
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
      \`\`\`json
      { "chartId": "bar", "labelKey": "categoria", "chartConfig": { "type": "bar", "title": "Ventas por Categoría", "description": "...", "series": [{ "name": "Ventas", "dataKey": "total_ventas", "data": [] }], "apexChart": { "type": "bar", "height": 290, "toolbar": { "show": false } }, "xaxis": { "axisBorder": { "show": false }, "axisTicks": { "show": false } }, "yaxis": { "labels": {} }, "colors": ["#4f46e5"], "stroke": { "show": true, "width": 2, "colors": ["transparent"] }, "fill": { "opacity": 1 }, "dataLabels": { "enabled": false }, "plotOptions": { "bar": { "borderRadius": 4, "columnWidth": "55%", "borderRadiusApplication": "end" } }, "grid": { "borderColor": "#E5E7EB", "strokeDashArray": 4, "yaxis": { "lines": { "show": true } }, "xaxis": { "lines": { "show": false } } }, "legend": { "show": false }, "tooltip": { "shared": true, "intersect": false }, "markers": { "size": 0 } } }
      \`\`\`

      ### 2. horizontal_bar — Barras Horizontales
      \`\`\`json
      { "chartId": "horizontal_bar", "labelKey": "producto", "chartConfig": { "type": "bar", "title": "Top Productos", "description": "...", "series": [{ "name": "Unidades", "dataKey": "unidades_vendidas", "data": [] }], "apexChart": { "type": "bar", "height": 290, "toolbar": { "show": false } }, "xaxis": { "axisBorder": { "show": false }, "axisTicks": { "show": false } }, "yaxis": { "labels": {} }, "colors": ["#4f46e5"], "stroke": { "show": true, "width": 2, "colors": ["transparent"] }, "fill": { "opacity": 1 }, "dataLabels": { "enabled": false }, "plotOptions": { "bar": { "horizontal": true, "borderRadius": 4 } }, "grid": { "borderColor": "#E5E7EB", "strokeDashArray": 4, "xaxis": { "lines": { "show": true } }, "yaxis": { "lines": { "show": false } } }, "legend": { "show": false }, "tooltip": { "shared": true, "intersect": false }, "markers": { "size": 0 } } }
      \`\`\`

      ### 3. grouped_bar — Barras Agrupadas
      \`\`\`json
      { "chartId": "grouped_bar", "labelKey": "mes", "chartConfig": { "type": "bar", "title": "Ventas vs Meta por Mes", "description": "...", "series": [{ "name": "Ventas Reales", "dataKey": "ventas", "data": [] }, { "name": "Meta", "dataKey": "meta", "data": [] }], "apexChart": { "type": "bar", "height": 290, "toolbar": { "show": false } }, "xaxis": { "axisBorder": { "show": false }, "axisTicks": { "show": false } }, "yaxis": { "labels": {} }, "colors": ["#4f46e5", "#06b6d4"], "stroke": { "show": true, "width": 2, "colors": ["transparent"] }, "fill": { "opacity": 1 }, "dataLabels": { "enabled": false }, "plotOptions": { "bar": { "borderRadius": 4, "columnWidth": "55%", "borderRadiusApplication": "end" } }, "grid": { "borderColor": "#E5E7EB", "strokeDashArray": 4, "yaxis": { "lines": { "show": true } }, "xaxis": { "lines": { "show": false } } }, "legend": { "show": true, "position": "top" }, "tooltip": { "shared": true, "intersect": false }, "markers": { "size": 0 } } }
      \`\`\`

      ### 4. stacked_bar — Barras Apiladas
      \`\`\`json
      { "chartId": "stacked_bar", "labelKey": "trimestre", "chartConfig": { "type": "bar", "title": "Ventas por Región (Apilado)", "description": "...", "series": [{ "name": "Norte", "dataKey": "ventas_norte", "data": [] }, { "name": "Sur", "dataKey": "ventas_sur", "data": [] }, { "name": "Centro", "dataKey": "ventas_centro", "data": [] }], "apexChart": { "type": "bar", "height": 290, "toolbar": { "show": false }, "stacked": true }, "xaxis": { "axisBorder": { "show": false }, "axisTicks": { "show": false } }, "yaxis": { "labels": {} }, "colors": ["#4f46e5", "#8b5cf6", "#06b6d4"], "stroke": { "show": true, "width": 2, "colors": ["transparent"] }, "fill": { "opacity": 1 }, "dataLabels": { "enabled": false }, "plotOptions": { "bar": { "borderRadius": 0, "columnWidth": "55%" } }, "grid": { "borderColor": "#E5E7EB", "strokeDashArray": 4, "yaxis": { "lines": { "show": true } }, "xaxis": { "lines": { "show": false } } }, "legend": { "show": true, "position": "top" }, "tooltip": { "shared": true, "intersect": false }, "markers": { "size": 0 } } }
      \`\`\`

      ### 5. line — Línea Simple
      \`\`\`json
      { "chartId": "line", "labelKey": "fecha", "chartConfig": { "type": "line", "title": "Evolución de Ventas", "description": "...", "series": [{ "name": "Ventas", "dataKey": "total_ventas", "data": [] }], "apexChart": { "type": "line", "height": 290, "toolbar": { "show": false } }, "xaxis": { "axisBorder": { "show": false }, "axisTicks": { "show": false } }, "yaxis": { "labels": {} }, "colors": ["#4f46e5"], "stroke": { "curve": "smooth", "width": 2 }, "fill": { "opacity": 1 }, "dataLabels": { "enabled": false }, "plotOptions": {}, "grid": { "borderColor": "#E5E7EB", "strokeDashArray": 4, "yaxis": { "lines": { "show": true } }, "xaxis": { "lines": { "show": false } } }, "legend": { "show": false }, "tooltip": { "shared": true, "intersect": false }, "markers": { "size": 0, "hover": { "size": 5 } } } }
      \`\`\`

      ### 6. multi_line — Múltiples Líneas
      \`\`\`json
      { "chartId": "multi_line", "labelKey": "mes", "chartConfig": { "type": "line", "title": "Ventas: Año Actual vs Anterior", "description": "...", "series": [{ "name": "Año Actual", "dataKey": "ventas_actual", "data": [] }, { "name": "Año Anterior", "dataKey": "ventas_anterior", "data": [] }], "apexChart": { "type": "line", "height": 290, "toolbar": { "show": false } }, "xaxis": { "axisBorder": { "show": false }, "axisTicks": { "show": false } }, "yaxis": { "labels": {} }, "colors": ["#4f46e5", "#D1D5DB"], "stroke": { "curve": "smooth", "width": 2 }, "fill": { "opacity": 1 }, "dataLabels": { "enabled": false }, "plotOptions": {}, "grid": { "borderColor": "#E5E7EB", "strokeDashArray": 4, "yaxis": { "lines": { "show": true } }, "xaxis": { "lines": { "show": false } } }, "legend": { "show": true, "position": "top" }, "tooltip": { "shared": true, "intersect": false }, "markers": { "size": 0 } } }
      \`\`\`

      ### 7. area_line — Área Rellena
      \`\`\`json
      { "chartId": "area_line", "labelKey": "fecha", "chartConfig": { "type": "area", "title": "Ingresos Acumulados", "description": "...", "series": [{ "name": "Ingresos", "dataKey": "total_ingresos", "data": [] }], "apexChart": { "type": "area", "height": 290, "toolbar": { "show": false } }, "xaxis": { "axisBorder": { "show": false }, "axisTicks": { "show": false } }, "yaxis": { "labels": {} }, "colors": ["#4f46e5"], "stroke": { "curve": "smooth", "width": 2 }, "fill": { "type": "gradient", "gradient": { "opacityFrom": 0.42, "opacityTo": 0.02, "shadeIntensity": 1, "stops": [0, 100] } }, "dataLabels": { "enabled": false }, "plotOptions": {}, "grid": { "borderColor": "#E5E7EB", "strokeDashArray": 4, "yaxis": { "lines": { "show": true } }, "xaxis": { "lines": { "show": false } } }, "legend": { "show": false }, "tooltip": { "shared": true, "intersect": false }, "markers": { "size": 0, "hover": { "size": 5 } } } }
      \`\`\`

      ### 8. bar_line_mixed — Gráfico Mixto Barra + Línea
      \`\`\`json
      { "chartId": "bar_line_mixed", "labelKey": "mes", "chartConfig": { "type": "line", "title": "Ventas y Crecimiento por Mes", "description": "...", "series": [{ "name": "Ventas ($)", "dataKey": "total_ventas", "data": [], "type": "bar" }, { "name": "Crecimiento (%)", "dataKey": "pct_crecimiento", "data": [], "type": "line" }], "apexChart": { "type": "line", "height": 290, "toolbar": { "show": false } }, "xaxis": { "axisBorder": { "show": false }, "axisTicks": { "show": false } }, "yaxis": [{ "labels": {}, "title": { "text": "Ventas ($)" } }, { "opposite": true, "labels": {}, "title": { "text": "Crecimiento (%)" } }], "colors": ["#4f46e5", "#f59e0b"], "stroke": { "curve": "smooth", "width": [0, 2] }, "fill": { "opacity": 1 }, "dataLabels": { "enabled": false }, "plotOptions": { "bar": { "borderRadius": 4, "columnWidth": "55%", "borderRadiusApplication": "end" } }, "grid": { "borderColor": "#E5E7EB", "strokeDashArray": 4, "yaxis": { "lines": { "show": true } }, "xaxis": { "lines": { "show": false } } }, "legend": { "show": true, "position": "top" }, "tooltip": { "shared": true, "intersect": false }, "markers": { "size": 0 } } }
      \`\`\`

      ### 9. pie — Pastel
      \`\`\`json
      { "chartId": "pie", "labelKey": "canal", "chartConfig": { "type": "pie", "title": "Participación por Canal", "description": "...", "series": [{ "name": "Participación", "dataKey": "pct_participacion", "data": [] }], "apexChart": { "type": "pie", "height": 290, "toolbar": { "show": false } }, "xaxis": {}, "yaxis": {}, "colors": ["#4f46e5", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"], "stroke": { "width": 2, "colors": ["#ffffff"] }, "fill": { "opacity": 1 }, "dataLabels": { "enabled": false }, "plotOptions": {}, "grid": {}, "legend": { "show": true, "position": "bottom" }, "tooltip": { "shared": false, "intersect": true }, "markers": { "size": 0 } } }
      \`\`\`

      ### 10. donut — Dona
      \`\`\`json
      { "chartId": "donut", "labelKey": "categoria", "chartConfig": { "type": "donut", "title": "Distribución de Gastos", "description": "...", "series": [{ "name": "Gasto", "dataKey": "monto_gasto", "data": [] }], "apexChart": { "type": "donut", "height": 290, "toolbar": { "show": false } }, "xaxis": {}, "yaxis": {}, "colors": ["#4f46e5", "#8b5cf6", "#06b6d4", "#10b981"], "stroke": { "width": 3, "colors": ["#ffffff"] }, "fill": { "opacity": 1 }, "dataLabels": { "enabled": false }, "plotOptions": { "pie": { "donut": { "size": "65%", "labels": { "show": true, "total": { "show": true, "label": "Total", "fontSize": "13px" } } } } }, "grid": {}, "legend": { "show": true, "position": "bottom" }, "tooltip": { "shared": false }, "markers": { "size": 0 } } }
      \`\`\`

      ### 11. radar — Radar / Araña
      \`\`\`json
      { "chartId": "radar", "labelKey": "dimension", "chartConfig": { "type": "radar", "title": "Comparativa de Productos", "description": "...", "series": [{ "name": "Producto A", "dataKey": "score_a", "data": [] }, { "name": "Producto B", "dataKey": "score_b", "data": [] }], "apexChart": { "type": "radar", "height": 290, "toolbar": { "show": false } }, "xaxis": { "axisBorder": { "show": false } }, "yaxis": { "labels": {} }, "colors": ["#4f46e5", "#f59e0b"], "stroke": { "curve": "smooth", "width": 2 }, "fill": { "opacity": 0.2 }, "dataLabels": { "enabled": false }, "plotOptions": {}, "grid": {}, "legend": { "show": true, "position": "top" }, "tooltip": { "shared": true, "intersect": false }, "markers": { "size": 4 } } }
      \`\`\`

      ### 12. scatter — Dispersión
      \`\`\`json
      { "chartId": "scatter", "labelKey": "precio", "chartConfig": { "type": "scatter", "title": "Precio vs Unidades Vendidas", "description": "...", "series": [{ "name": "Productos", "dataKey": "unidades_vendidas", "data": [] }], "apexChart": { "type": "scatter", "height": 290, "toolbar": { "show": false } }, "xaxis": { "type": "numeric", "axisBorder": { "show": false }, "axisTicks": { "show": false } }, "yaxis": { "labels": {} }, "colors": ["rgba(79,70,229,0.6)"], "stroke": { "width": 0 }, "fill": { "opacity": 0.7 }, "dataLabels": { "enabled": false }, "plotOptions": {}, "grid": { "borderColor": "#E5E7EB", "strokeDashArray": 4, "yaxis": { "lines": { "show": true } }, "xaxis": { "lines": { "show": false } } }, "legend": { "show": false }, "tooltip": { "shared": false, "intersect": true }, "markers": { "size": 6 } } }
      \`\`\`

      ### 13. table — Tabla de Datos
      \`\`\`json
      { "chartId": "table", "labelKey": "id", "chartConfig": { "type": "table", "title": "Detalle de Ventas", "description": "...", "series": [], "apexChart": { "type": "bar", "height": 290, "toolbar": { "show": false } }, "xaxis": {}, "yaxis": {}, "colors": [], "stroke": {}, "fill": {}, "dataLabels": {}, "plotOptions": {}, "grid": {}, "legend": {}, "tooltip": {}, "markers": {}, "columns": [{ "key": "cliente", "label": "Cliente", "type": "string" }, { "key": "ventas", "label": "Ventas ($)", "type": "number" }, { "key": "fecha", "label": "Fecha", "type": "date" }] } }
      \`\`\`

      ## ORDEN DE PRIORIDAD PARA SELECCIÓN

      1. **¿Hay fechas/tiempo?** → line, area_line, bar, bar_line_mixed
      2. **¿Hay comparación de períodos?** → multi_line, grouped_bar
      3. **¿Hay proporciones?** → pie, donut, stacked_bar
      4. **¿Hay muchas categorías (>8)?** → horizontal_bar, table
      5. **¿Hay múltiples dimensiones?** → radar, scatter
      6. **Siempre incluir** → table como última opción
    `;

    const dataPrompt =
      `## DATOS A ANALIZAR\n\n` +
      `Consulta del usuario: "${params.userQuery}"\n` +
      `Total de filas: ${params.rowCount}\n` +
      `Columnas: ${JSON.stringify(params.columns)}\n` +
      `Muestra de datos (primeras 10 filas):\n${JSON.stringify(params.dataSample.slice(0, 10), null, 2)}\n\n` +
      `Responde SOLO con JSON válido siguiendo la estructura AnalysisResult definida arriba.`;

    const fullPrompt = systemPrompt + "\n\n" + dataPrompt;

    writeFileSync("tmp/prompt_debug_graphig.txt", fullPrompt, "utf-8");

    const content = `Eres un motor de visualización de datos.
                Tu salida debe ser exclusivamente JSON.
                Usa estos colores: ${this.CHART_PALETTE.join(", ")}.`;
    const raw = await this.llm.generateContent(fullPrompt, content);

    writeFileSync("tmp/response-second-llm.json", raw, "utf-8");

    return this.parseAnalysisResponse(raw);
  }

  protected parseAnalysisResponse(raw: string): AnalysisResult {
    let cleaned = raw.trim();
    const codeBlock = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (codeBlock) cleaned = codeBlock[1].trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned) as Record<string, unknown>;
    } catch (e) {
      const openBraces = (cleaned.match(/\{/g) ?? []).length;
      const closeBraces = (cleaned.match(/\}/g) ?? []).length;
      if (openBraces > closeBraces) {
        throw new LlmErrorException(
          `La respuesta del LLM fue truncada (JSON incompleto: ${openBraces} '{' vs ${closeBraces} '}'). ` +
          `Aumenta max_tokens en qwen.llm.service.ts o simplifica el prompt.`,
        );
      }
      throw new LlmErrorException(
        `JSON inválido en la respuesta del LLM: ${e instanceof Error ? e.message : String(e)}. ` +
        `Primeros 300 chars: ${cleaned.slice(0, 300)}`,
      );
    }

    if (!Array.isArray(parsed["charts"]) || (parsed["charts"] as unknown[]).length === 0) {
      throw new LlmErrorException("El modelo no generó charts válidos.");
    }

    const charts = parsed["charts"] as ChartItem[];
    const recommendedChart = typeof parsed["recommendedChart"] === "number" ? parsed["recommendedChart"] : 0;

    return {
      charts,
      recommendedChart,
      explanation: (parsed["explanation"] as string) ?? "",
      suggestedFollowUps: (parsed["suggestedFollowUps"] as string[]) ?? [],
    };
  }
}
