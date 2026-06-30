-- Average Session Duration: How long do users spend in the app per session (last 30 days)?

SELECT
  DATE(session_start) AS day,
  COUNT(*) AS sessions,
  ROUND(AVG(duration_seconds)) AS avg_duration_seconds,
  ROUND(AVG(duration_seconds) / 60.0, 1) AS avg_duration_minutes
FROM public.user_sessions
WHERE session_end IS NOT NULL
  AND session_start > NOW() - INTERVAL '30 days'
GROUP BY day
ORDER BY day DESC;
