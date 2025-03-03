/*
  # Fix Blueprint Update and Delete Policies

  1. Changes
    - Add update and delete policies for blueprints
    - Add update and delete policies for blueprint categories
    - Ensure proper access control for all operations

  2. Security
    - Users can only update/delete their own blueprints
    - Users can manage categories if they own either the blueprint or category
*/

-- Add update and delete policies for blueprints
CREATE POLICY "Users can update own blueprints"
  ON blueprints
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own blueprints"
  ON blueprints
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Add update and delete policies for blueprint categories
CREATE POLICY "Users can update blueprint categories"
  ON blueprint_categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM blueprints WHERE id = blueprint_id AND user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM automation_categories WHERE id = category_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete blueprint categories"
  ON blueprint_categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM blueprints WHERE id = blueprint_id AND user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM automation_categories WHERE id = category_id AND user_id = auth.uid()
    )
  );