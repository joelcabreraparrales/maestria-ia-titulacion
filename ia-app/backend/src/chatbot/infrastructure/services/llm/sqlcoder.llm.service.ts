import { writeFileSync } from "fs";
import { AnalysisResult } from "../../../domain/interfaces/chart-config.interface";
import { GenerateAnalysisParams, GenerateSqlParams } from "../../../domain/interfaces/conversation.interface";
import { LlmErrorException } from "../../../domain/exceptions/llm-error.exception";
import { OllamaBaseLlmService } from "./ollama.base.llm.service";

export class SqlCoderLlmService extends OllamaBaseLlmService {
  constructor(model: string) {
    super(model);
  }

  public async generateSql(params: GenerateSqlParams): Promise<string[]> {
    const relationships = this.buildRelationships(params.schema);
    const schemaJson = JSON.stringify(params.schema, null, 2);

    const prompt = `
        ### ROLE:
        You are a senior PostgreSQL data analyst specializing in business intelligence and analytical queries for dashboards and statistical charts.

        ### CRITICAL RULES (VIOLATION = FAILURE):
        1.  PostgreSQL syntax ONLY - no SQL Server, MySQL, or Oracle functions
        2.  Column names MUST match EXACTLY from the schema JSON (case-sensitive)
        3.  Table names MUST be fully qualified: schema_name.table_name
        4.  JOIN columns MUST come from the relationships section - never guess
        5.  Return ONLY SQL queries - no explanations, no markdown code blocks
        6.  Multiple queries separated by: ---
        7.  Each query ends with: LIMIT 1000

        ### DATA QUALITY RULES (always apply unless user explicitly asks otherwise):
        8.  FILTER ZERO/NULL METRICS: Exclude rows where the primary metric is NULL or 0.
            - Raw rows:    WHERE metric_column > 0 AND metric_column IS NOT NULL
            - Aggregates:  HAVING SUM(metric) > 0 OR HAVING COUNT(*) > 0
            - Proportions: HAVING COUNT(DISTINCT id) > 0
        9.  MEANINGFUL GROUPINGS ONLY: When grouping by a dimension (category, region,
            product, territory), only include groups with real activity.
            Bad:  GROUP BY category
            Good: GROUP BY category HAVING SUM(total_revenue) > 0
        10. COALESCE ALL NULLABLE METRICS: Wrap nullable numeric columns:
            COALESCE(SUM(soh.totaldue), 0) AS total_revenue
            Still apply HAVING COALESCE(SUM(soh.totaldue), 0) > 0 to exclude empty groups.
        11. DATE RANGE COHERENCE: Apply date filters on the outermost query when using CTEs.
            Every subquery or CTE that references fact tables must include the date filter.

        ### POSTGRESQL-SPECIFIC REQUIREMENTS:
        - Time truncation: Use DATE_TRUNC('month', column) or DATE_TRUNC('year', column)
        - Date extraction: Use EXTRACT(YEAR FROM column), EXTRACT(MONTH FROM column)
        - Date arithmetic: Use column - INTERVAL '3 years' or column + INTERVAL '1 month'
        - Current date: Use CURRENT_DATE or NOW()
        - Null handling: Use COALESCE(column, 0) and NULLIF(denominator, 0)
        - Window functions: Use OVER (PARTITION BY ... ORDER BY ...) for YoY, MoM calculations
        - CTEs: Use WITH clauses for complex multi-step transformations

        ### DATE HANDLING RULE (DEVELOPMENT vs PRODUCTION):
        ENVIRONMENT: DEVELOPMENT
        **FOR DEVELOPMENT/HISTORICAL DATA (AdventureWorks, samples, etc.):**
        - NEVER use CURRENT_DATE for filtering
        - ALWAYS detect max date from the main fact table first
        - Use this pattern:
          WITH date_params AS (
              SELECT 
                  MAX(orderdate) - INTERVAL '3 years' AS min_date,
                  MAX(orderdate) AS max_date
              FROM sales.salesorderheader
          )

        ### OUTPUT FORMAT FOR CHARTS:
        Each query should return columns optimized for visualization:
        - time_dimension: AS sales_month, sales_year, sales_period (consistent naming)
        - metrics: AS total_revenue, total_orders, avg_value (clear metric names)
        - dimensions: AS territory_name, product_category, customer_segment
        - comparisons: AS yoy_growth_pct, mom_growth_pct, previous_period_value

        ### QUERY COMPLEXITY EXPECTATIONS:
        For analytical reports, include:
        - Aggregations (SUM, COUNT, AVG, MIN, MAX)
        - Window functions for comparisons (LAG, LEAD, running totals)
        - CTEs for multi-step transformations
        - Proper filtering for date ranges
        - Percentage calculations with NULLIF protection

        ### TABLE RELATIONSHIPS (USE EXACTLY THESE):
        ${relationships}

        ### SCHEMA (JSON):
        ${schemaJson}

        ### EXAMPLE QUERY PATTERNS:

        -- Time series with YoY comparison
        SELECT 
            DATE_TRUNC('month', soh.orderdate) AS sales_month,
            SUM(soh.totaldue) AS total_revenue,
            LAG(SUM(soh.totaldue), 12) OVER (ORDER BY DATE_TRUNC('month', soh.orderdate)) AS previous_year_revenue,
            ROUND(((SUM(soh.totaldue) - LAG(SUM(soh.totaldue), 12) OVER (ORDER BY DATE_TRUNC('month', soh.orderdate))) / 
                  NULLIF(LAG(SUM(soh.totaldue), 12) OVER (ORDER BY DATE_TRUNC('month', soh.orderdate)), 0)) * 100, 2) AS yoy_growth_pct
        FROM sales.salesorderheader soh
        WHERE soh.orderdate >= CURRENT_DATE - INTERVAL '3 years'
        GROUP BY DATE_TRUNC('month', soh.orderdate)
        ORDER BY sales_month
        LIMIT 1000

        -- Multi-dimensional aggregation
        SELECT 
            DATE_TRUNC('month', soh.orderdate) AS sales_month,
            pc.name AS product_category,
            SUM(sod.linetotal) AS total_revenue,
            COUNT(DISTINCT soh.salesorderid) AS total_orders
        FROM sales.salesorderheader soh
        INNER JOIN sales.salesorderdetail sod ON soh.salesorderid = sod.salesorderid
        INNER JOIN production.product p ON sod.productid = p.productid
        INNER JOIN production.productsubcategory ps ON p.productsubcategoryid = ps.productsubcategoryid
        INNER JOIN production.productcategory pc ON ps.productcategoryid = pc.productcategoryid
        WHERE soh.orderdate >= CURRENT_DATE - INTERVAL '3 years'
        GROUP BY DATE_TRUNC('month', soh.orderdate), pc.name
        ORDER BY sales_month, total_revenue DESC
        LIMIT 1000

        ### USER QUESTION:
        ${params.userQuery}

        ### RESPONSE (SQL ONLY):
      `;
    writeFileSync("tmp/prompt_debug_coder_sql.txt", prompt, "utf-8");

    const raw = await this.callOllama([{ role: "user", content: prompt }], { temperature: 0.1, maxTokens: 2048 });

    return this.extractSql(raw);
  }

  public async generateAnalysis(_params: GenerateAnalysisParams): Promise<AnalysisResult> {
    throw new LlmErrorException("SqlCoderLlmService no soporta generateAnalysis. Use QwenLlmService.");
  }
}
