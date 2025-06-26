-- Add sort_order column to notes table
ALTER TABLE notes 
ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Create index for better performance when sorting
CREATE INDEX idx_notes_sort_order ON notes(user_id, sort_order);

-- Update existing notes to have sequential sort_order
UPDATE notes 
SET sort_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as row_num
  FROM notes
) as subquery
WHERE notes.id = subquery.id;

-- Add comment to document the column
COMMENT ON COLUMN notes.sort_order IS 'Order for displaying notes within a user''s collection'; 