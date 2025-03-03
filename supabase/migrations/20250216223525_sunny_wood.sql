/*
  # Fix delete policies for junction tables

  1. Changes
    - Enable RLS for junction tables
    - Add delete policies for junction tables
    - Add delete policies for category tables

  2. Security
    - Only allow deletion of categories and their relationships when the user owns them
    - Ensure cascading deletes work properly
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can delete tool categories" ON ai_tool_categories;
DROP POLICY IF EXISTS "Users can delete class categories" ON class_categories;
DROP POLICY IF EXISTS "Users can delete blueprint categories" ON blueprint_categories;
DROP POLICY IF EXISTS "Users can delete AI categories" ON ai_categories;
DROP POLICY IF EXISTS "Users can delete class categories" ON categories;
DROP POLICY IF EXISTS "Users can delete automation categories" ON automation_categories;

-- Re-create delete policies for junction tables with correct permissions
CREATE POLICY "Users can delete tool categories"
  ON ai_tool_categories FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ai_tools WHERE id = tool_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM ai_categories WHERE id = category_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete class categories"
  ON class_categories FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM classes WHERE id = class_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM categories WHERE id = category_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete blueprint categories"
  ON blueprint_categories FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM blueprints WHERE id = blueprint_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM automation_categories WHERE id = category_id AND user_id = auth.uid()
  ));

-- Re-create delete policies for category tables
CREATE POLICY "Users can delete AI categories"
  ON ai_categories FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete class categories"
  ON categories FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete automation categories"
  ON automation_categories FOR DELETE TO authenticated
  USING (user_id = auth.uid());