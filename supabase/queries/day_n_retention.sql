-- Day-N Retention: For each signup cohort, how many returned on day 1, 7, 30?
-- Run this in the Supabase SQL Editor with your service role key.

WITH signups AS (
  SELECT
    user_id,
    DATE(MIN(created_at)) AS signup_date
  FROM public.analytics_events
  WHERE event_name = 'signup_completed'
  GROUP BY user_id
)
SELECT
  s.signup_date,
  COUNT(DISTINCT s.user_id) AS cohort_size,
  COUNT(DISTINCT CASE
    WHEN e.created_at::date = s.signup_date + INTERVAL '1 day' THEN s.user_id
  END) AS day_1,
  COUNT(DISTINCT CASE
    WHEN e.created_at::date = s.signup_date + INTERVAL '7 days' THEN s.user_id
  END) AS day_7,
  COUNT(DISTINCT CASE
    WHEN e.created_at::date = s.signup_date + INTERVAL '30 days' THEN s.user_id
  END) AS day_30
FROM signups s
LEFT JOIN public.analytics_events e
  ON s.user_id = e.user_id
  AND e.event_name = 'app_opened'
GROUP BY s.signup_date
ORDER BY s.signup_date DESC;
