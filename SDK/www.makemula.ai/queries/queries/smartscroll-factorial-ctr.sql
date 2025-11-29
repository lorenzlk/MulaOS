-- Parameterized Factorial CTR Analysis
-- Analyzes click-through rates by variant with statistical significance
-- Parameters: {{days_back}}, {{experiment_name}}

WITH experiment_events AS (
  SELECT
    properties['host'] AS host,
    properties['sessionId'] AS sessionId,
    properties['eventName'] AS eventName,
    properties['eventValue'] AS eventValue,
    properties['experiment'] AS experiment,
    properties['variant'] AS variant,
    -- Extract date from datehour for daily bucketing
    date_parse(substring(datehour, 1, 10), '%Y/%m/%d') AS event_date
  FROM mula.webtag_logs
  WHERE datehour >= date_format(current_timestamp - interval '{{days_back}}' day, '%Y/%m/%d/%H')
    AND properties['eventName'] IN ('mula_in_view', 'mula_store_click')
    AND properties['experiment'] = '{{experiment_name}}'
    AND properties['widget'] = 'smartscroll'
    AND properties['host'] NOT LIKE '%localhost%'
),
-- Get widget views by experiment variant (using mula_in_view for accurate visibility metrics)
widget_views AS (
  SELECT
    experiment,
    variant,
    COUNT(DISTINCT sessionId) AS widget_views
  FROM experiment_events
  WHERE eventName = 'mula_in_view'
  GROUP BY experiment, variant
),

-- Get store clicks by experiment variant
store_clicks AS (
  SELECT
    experiment,
    variant,
    COUNT(*) AS store_clicks
  FROM experiment_events
  WHERE eventName = 'mula_store_click'
  GROUP BY experiment, variant
),

-- Combine metrics
variant_metrics AS (
  SELECT
    COALESCE(wv.experiment, sc.experiment) AS experiment,
    COALESCE(wv.variant, sc.variant) AS variant,
    -- Add descriptive labels
    CASE COALESCE(wv.variant, sc.variant)
        WHEN 'c00' THEN 'Control (Current Layout + Mula Only)'
        WHEN 'c10' THEN 'Optimized Layout (Optimized Layout + Mula Only)'
        WHEN 'c01' THEN 'RevContent Monetization (Current Layout + Mula + RevContent)'
        WHEN 'c11' THEN 'Optimized + RevContent (Optimized Layout + Mula + RevContent)'
        ELSE 'Unknown'
    END as variant_description,
    COALESCE(wv.widget_views, 0) AS sessions,
    COALESCE(wv.widget_views, 0) AS views,
    COALESCE(sc.store_clicks, 0) AS clicks
  FROM widget_views wv
  FULL OUTER JOIN store_clicks sc 
    ON wv.experiment = sc.experiment 
    AND wv.variant = sc.variant
),
ctr_calculation AS (
    SELECT 
        variant,
        variant_description,
        sessions,
        views,
        clicks,
        CASE 
            WHEN views > 0 THEN CAST(clicks AS DOUBLE) / CAST(views AS DOUBLE)
            ELSE 0 
        END as ctr,
        -- Statistical significance calculation
        CASE 
            WHEN views > 0 AND clicks > 0 THEN
                -- Chi-square test for CTR difference
                POWER(CAST(clicks AS DOUBLE) - (CAST(views AS DOUBLE) * 0.01), 2) / (CAST(views AS DOUBLE) * 0.01) +
                POWER((CAST(views AS DOUBLE) - CAST(clicks AS DOUBLE)) - (CAST(views AS DOUBLE) * 0.99), 2) / (CAST(views AS DOUBLE) * 0.99)
            ELSE 0
        END as chi_square
    FROM variant_metrics
)
SELECT 
    variant,
    variant_description,
    sessions,
    views,
    clicks,
    ROUND(ctr * 100, 4) as ctr_percent,
    ROUND(chi_square, 4) as chi_square_statistic,
    CASE 
        WHEN chi_square > 3.84 THEN 'Significant (p < 0.05)'
        WHEN chi_square > 2.71 THEN 'Significant (p < 0.10)'
        ELSE 'Not Significant'
    END as significance
FROM ctr_calculation
ORDER BY variant;
