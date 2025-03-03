/*
  # Add Update and Delete Policies for Junction Tables

  1. Changes
    - Add update policies for blueprint_categories
    - Add delete policies for blueprint_categories
    - Add update policies for ai_tool_categories
    - Add delete policies for ai_tool_categories
    - Add update policies for class_categories
    - Add delete policies for class_categories

  2. Security
    - Policies ensure users can only modify their own data
    - Checks both the owner of the main entity and the category
*/

-- Update policies for blueprint_categories
CREATE POLICY "Users can update blueprint categories"
  ON blueprint_categories
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM blueprints WHERE id = blueprint_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete blueprint categories"
  ON blueprint_categories
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM blueprints WHERE id = blueprint_id AND user_id = auth.uid()
  ));

-- Update policies for ai_tool_categories
CREATE POLICY "Users can update tool categories"
  ON ai_tool_categories
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ai_tools WHERE id = tool_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete tool categories"
  ON ai_tool_categories
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ai_tools WHERE id = tool_id AND user_id = auth.uid()
  ));

-- Update policies for class_categories
CREATE POLICY "Users can update class categories"
  ON class_categories
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM classes WHERE id = class_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete class categories"
  ON class_categories
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM classes WHERE id = class_id AND user_id = auth.uid()
  ));