-- Inactive Users: Users who were active 7-14 days ago but have no activity in the last 7 days.
-- These are users at risk of churning.

SELECT DISTINCT user_id
FROM public.analytics_events
WHERE created_at BETWEEN NOW() - INTERVAL '14 days' AND NOW() - INTERVAL '7 days'
  AND user_id NOT IN (
    SELECT DISTINCT user_id
    FROM public.analytics_events
    WHERE created_at > NOW() - INTERVAL '7 days'
  )
ORDER BY user_id;
