/*
  # Fix Blueprint Categories Insert Policy

  1. Changes
    - Add insert policy for blueprint categories
    - Ensure proper access control for category assignments

  2. Security
    - Users can insert categories if they own either:
      - The blueprint
      - The category
*/

-- Add insert policy for blueprint categories
CREATE POLICY "Users can insert blueprint categories"
  ON blueprint_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM blueprints WHERE id = blueprint_id AND user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM automation_categories WHERE id = category_id AND user_id = auth.uid()
    )
  );