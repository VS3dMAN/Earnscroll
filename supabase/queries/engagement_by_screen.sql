-- Engagement by Screen: Which screens get the most views and unique users (last 7 days)?

SELECT
  (event_properties->>'screen_name')::text AS screen_name,
  COUNT(*) AS total_views,
  COUNT(DISTINCT user_id) AS unique_users
FROM public.analytics_events
WHERE event_name = 'screen_view'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY screen_name
ORDER BY total_views DESC;
