-- Create a function to get top posters
CREATE OR REPLACE FUNCTION get_top_posters(limit_count integer)
RETURNS TABLE (
  user_id uuid,
  post_count bigint
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    posts.user_id,
    COUNT(posts.id)::bigint as post_count
  FROM 
    posts
  GROUP BY 
    posts.user_id
  ORDER BY 
    post_count DESC
  LIMIT 
    limit_count;
END;
$$;
