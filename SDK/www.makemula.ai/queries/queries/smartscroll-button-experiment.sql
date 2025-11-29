-- SmartScroll Button A/B Test Analysis
-- Description: Analyzes the performance of the SmartScroll button experiment
-- Parameters: days_back (default: 7), experiment_name (default: 'smartscroll_button_variant')
-- Output: experiment, variant, widget_views, store_clicks, ctr, lift, statistical_significance, chi_square_statistic, p_value
-- Note: Uses mula_in_view (viewport visibility) as CTR denominator for accurate engagement metrics

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
experiment_metrics AS (
  SELECT
    COALESCE(wv.experiment, sc.experiment) AS experiment,
    COALESCE(wv.variant, sc.variant) AS variant,
    COALESCE(wv.widget_views, 0) AS widget_views,
    COALESCE(sc.store_clicks, 0) AS store_clicks,
    CASE 
      WHEN COALESCE(wv.widget_views, 0) > 0 
      THEN CAST(COALESCE(sc.store_clicks, 0) AS DOUBLE) / CAST(wv.widget_views AS DOUBLE)
      ELSE 0 
    END AS ctr
  FROM widget_views wv
  FULL OUTER JOIN store_clicks sc 
    ON wv.experiment = sc.experiment 
    AND wv.variant = sc.variant
),

-- Calculate control metrics for lift calculation
control_metrics AS (
  SELECT 
    experiment,
    widget_views AS control_widget_views,
    store_clicks AS control_store_clicks,
    ctr AS control_ctr
  FROM experiment_metrics 
  WHERE variant = 'control'
),

-- Calculate treatment metrics and lift
treatment_metrics AS (
  SELECT 
    em.experiment,
    em.variant,
    em.widget_views,
    em.store_clicks,
    em.ctr,
    cm.control_widget_views,
    cm.control_store_clicks,
    cm.control_ctr,
    CASE 
      WHEN cm.control_ctr > 0 
      THEN (em.ctr - cm.control_ctr) / cm.control_ctr * 100
      ELSE NULL 
    END AS ctr_lift_percent
  FROM experiment_metrics em
  CROSS JOIN control_metrics cm
  WHERE em.variant != 'control'
    AND em.experiment = cm.experiment
),

-- Statistical significance calculation using Chi-square test
statistical_significance AS (
  SELECT 
    tm.*,
    -- Chi-square test for CTR difference
    CASE 
      WHEN tm.control_widget_views > 0 AND tm.widget_views > 0 THEN
        -- Calculate chi-square statistic
        POWER(tm.store_clicks - (tm.widget_views * tm.control_ctr), 2) / (tm.widget_views * tm.control_ctr * (1 - tm.control_ctr)) +
        POWER(tm.control_store_clicks - (tm.control_widget_views * tm.control_ctr), 2) / (tm.control_widget_views * tm.control_ctr * (1 - tm.control_ctr))
      ELSE NULL 
    END AS chi_square_statistic,
    
    -- P-value approximation using chi-square distribution
    CASE 
      WHEN tm.control_widget_views > 0 AND tm.widget_views > 0 THEN
        -- For chi-square with 1 degree of freedom, use approximation for p-value
        -- This is a simplified approximation: p ≈ exp(-chi_square/2) / sqrt(2*pi*chi_square)
        CASE 
          WHEN POWER(tm.store_clicks - (tm.widget_views * tm.control_ctr), 2) / (tm.widget_views * tm.control_ctr * (1 - tm.control_ctr)) +
               POWER(tm.control_store_clicks - (tm.control_widget_views * tm.control_ctr), 2) / (tm.control_widget_views * tm.control_ctr * (1 - tm.control_ctr)) > 0
          THEN 
            -- Simplified p-value calculation for chi-square with 1 df
            -- For chi-square > 3.841, p < 0.05; for chi-square > 6.635, p < 0.01
            CASE 
              WHEN POWER(tm.store_clicks - (tm.widget_views * tm.control_ctr), 2) / (tm.widget_views * tm.control_ctr * (1 - tm.control_ctr)) +
                   POWER(tm.control_store_clicks - (tm.control_widget_views * tm.control_ctr), 2) / (tm.control_widget_views * tm.control_ctr * (1 - tm.control_ctr)) > 6.635
              THEN 0.01
              WHEN POWER(tm.store_clicks - (tm.widget_views * tm.control_ctr), 2) / (tm.widget_views * tm.control_ctr * (1 - tm.control_ctr)) +
                   POWER(tm.control_store_clicks - (tm.control_widget_views * tm.control_ctr), 2) / (tm.control_widget_views * tm.control_ctr * (1 - tm.control_ctr)) > 3.841
              THEN 0.05
              WHEN POWER(tm.store_clicks - (tm.widget_views * tm.control_ctr), 2) / (tm.widget_views * tm.control_ctr * (1 - tm.control_ctr)) +
                   POWER(tm.control_store_clicks - (tm.control_widget_views * tm.control_ctr), 2) / (tm.control_widget_views * tm.control_ctr * (1 - tm.control_ctr)) > 2.706
              THEN 0.10
              ELSE 0.50
            END
          ELSE 1.0
        END
      ELSE NULL 
    END AS p_value,
    
    -- P-value approximation (simplified)
    CASE 
      WHEN tm.control_widget_views > 0 AND tm.widget_views > 0 THEN
        -- For chi-square with 1 degree of freedom, p < 0.05 if chi-square > 3.841
        CASE 
          WHEN POWER(tm.store_clicks - (tm.widget_views * tm.control_ctr), 2) / (tm.widget_views * tm.control_ctr * (1 - tm.control_ctr)) +
               POWER(tm.control_store_clicks - (tm.control_widget_views * tm.control_ctr), 2) / (tm.control_widget_views * tm.control_ctr * (1 - tm.control_ctr)) > 3.841
          THEN 'Significant (p < 0.05)'
          ELSE 'Not Significant (p >= 0.05)'
        END
      ELSE 'Insufficient Data'
    END AS statistical_significance
  FROM treatment_metrics tm
)

-- Final results
SELECT 
  experiment,
  variant,
  widget_views,
  store_clicks,
  ROUND(ctr * 100, 4) AS ctr_percent,
  ROUND(ctr_lift_percent, 2) AS ctr_lift_percent,
  statistical_significance,
  ROUND(chi_square_statistic, 4) AS chi_square_statistic,
  ROUND(p_value, 4) AS p_value,
  -- Add control metrics for reference
  control_widget_views,
  control_store_clicks,
  ROUND(control_ctr * 100, 4) AS control_ctr_percent
FROM statistical_significance

UNION ALL

-- Include control variant
SELECT 
  experiment,
  variant,
  widget_views,
  store_clicks,
  ROUND(ctr * 100, 4) AS ctr_percent,
  NULL AS ctr_lift_percent,
  'Control' AS statistical_significance,
  NULL AS chi_square_statistic,
  NULL AS p_value,
  widget_views AS control_widget_views,
  store_clicks AS control_store_clicks,
  ROUND(ctr * 100, 4) AS control_ctr_percent
FROM experiment_metrics 
WHERE variant = 'control'

ORDER BY experiment, variant; 