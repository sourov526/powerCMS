-- Remove many-to-many categories; keep posts.categoryId as the single source of truth.
-- If a post has no categoryId but has post_categories rows, keep the oldest entry as primary.

-- Old DBs may still have post_categories; new DBs may not (if created from updated 0001).
-- Create an empty compatible table if missing so this migration is safe to run everywhere.
CREATE TABLE IF NOT EXISTS post_categories (
  postId INTEGER NOT NULL,
  categoryId INTEGER NOT NULL,
  createdBy INTEGER,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (postId, categoryId)
);

UPDATE posts
SET categoryId = (
  SELECT pc.categoryId
  FROM post_categories pc
  WHERE pc.postId = posts.id
  ORDER BY pc.createdAt ASC, pc.categoryId ASC
  LIMIT 1
)
WHERE (categoryId IS NULL OR categoryId = 0)
  AND EXISTS (SELECT 1 FROM post_categories pc WHERE pc.postId = posts.id);

DROP TABLE IF EXISTS post_categories;
