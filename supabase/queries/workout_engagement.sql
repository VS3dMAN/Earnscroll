-- Workout Engagement: Workout completions by exercise type, avg reps, avg duration (last 30 days).

SELECT
  (event_properties->>'exercise')::text AS exercise,
  COUNT(*) AS total_workouts,
  COUNT(DISTINCT user_id) AS unique_users,
  AVG((event_properties->>'rep_count')::int) AS avg_reps,
  AVG((event_properties->>'duration_seconds')::int) AS avg_duration_seconds
FROM public.analytics_events
WHERE event_name = 'workout_completed'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY exercise
ORDER BY total_workouts DESC;
