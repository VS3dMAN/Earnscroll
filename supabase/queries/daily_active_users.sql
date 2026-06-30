-- Daily Active Users (DAU): Unique users per day over the last 30 days.

SELECT
  created_at::date AS day,
  COUNT(DISTINCT user_id) AS dau
FROM public.analytics_events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY day
ORDER BY day DESC;
