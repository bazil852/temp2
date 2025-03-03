/*
  # Fix Junction Table Policies

  1. Changes
    - Drop existing policies that may be causing conflicts
    - Create new comprehensive policies for junction tables
    - Ensure proper access control for all operations

  2. Security
    - Users can only modify junction table entries if they own either:
      a) The main entity (blueprint, tool, or class)
      b) The category
    - This allows for more flexible management while maintaining security
*/

-- Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Users can create blueprint categories" ON blueprint_categories;
DROP POLICY IF EXISTS "Users can update blueprint categories" ON blueprint_categories;
DROP POLICY IF EXISTS "Users can delete blueprint categories" ON blueprint_categories;

-- Create comprehensive policies for blueprint_categories
CREATE POLICY "Users can manage blueprint categories"
  ON blueprint_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM blueprints WHERE id = blueprint_id AND user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM automation_categories WHERE id = category_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM blueprints WHERE id = blueprint_id AND user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM automation_categories WHERE id = category_id AND user_id = auth.uid()
    )
  );

-- Drop existing policies for ai_tool_categories
DROP POLICY IF EXISTS "Users can create tool categories" ON ai_tool_categories;
DROP POLICY IF EXISTS "Users can update tool categories" ON ai_tool_categories;
DROP POLICY IF EXISTS "Users can delete tool categories" ON ai_tool_categories;

-- Create comprehensive policies for ai_tool_categories
CREATE POLICY "Users can manage tool categories"
  ON ai_tool_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ai_tools WHERE id = tool_id AND user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM ai_categories WHERE id = category_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_tools WHERE id = tool_id AND user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM ai_categories WHERE id = category_id AND user_id = auth.uid()
    )
  );

-- Drop existing policies for class_categories
DROP POLICY IF EXISTS "Users can create class categories" ON class_categories;
DROP POLICY IF EXISTS "Users can update class categories" ON class_categories;
DROP POLICY IF EXISTS "Users can delete class categories" ON class_categories;

-- Create comprehensive policies for class_categories
CREATE POLICY "Users can manage class categories"
  ON class_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM classes WHERE id = class_id AND user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM categories WHERE id = category_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classes WHERE id = class_id AND user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM categories WHERE id = category_id AND user_id = auth.uid()
    )
  );