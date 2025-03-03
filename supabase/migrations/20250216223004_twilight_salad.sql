/*
  # Add delete policies for junction tables

  1. Changes
    - Add delete policies for ai_tool_categories
    - Add delete policies for class_categories
    - Add delete policies for blueprint_categories
    - Add delete policies for categories tables

  2. Security
    - Only allow deletion of category relationships when the user owns the parent item
    - Allow cascading deletes when a category is deleted
*/

-- Add delete policies for junction tables
CREATE POLICY "Users can delete tool categories"
  ON ai_tool_categories FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ai_tools WHERE id = tool_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete class categories"
  ON class_categories FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM classes WHERE id = class_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete blueprint categories"
  ON blueprint_categories FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM blueprints WHERE id = blueprint_id AND user_id = auth.uid()
  ));

-- Add delete policies for category tables
CREATE POLICY "Users can delete AI categories"
  ON ai_categories FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete class categories"
  ON categories FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete automation categories"
  ON automation_categories FOR DELETE TO authenticated
  USING (user_id = auth.uid());