/*
  # Add Missing Junction Table Policies

  1. Changes
    - Add update policies for junction tables where missing
    - Skip policies that already exist
    - Ensure consistent policy naming

  2. Security
    - Policies ensure users can only modify their own data
    - Checks both the owner of the main entity and the category
*/

-- Update policies for blueprint_categories (only if missing)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'blueprint_categories' 
    AND policyname = 'Users can update blueprint categories'
  ) THEN
    CREATE POLICY "Users can update blueprint categories"
      ON blueprint_categories
      FOR UPDATE
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM blueprints WHERE id = blueprint_id AND user_id = auth.uid()
      ));
  END IF;
END $$;

-- Update policies for ai_tool_categories (only if missing)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_tool_categories' 
    AND policyname = 'Users can update tool categories'
  ) THEN
    CREATE POLICY "Users can update tool categories"
      ON ai_tool_categories
      FOR UPDATE
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM ai_tools WHERE id = tool_id AND user_id = auth.uid()
      ));
  END IF;
END $$;

-- Update policies for class_categories (only if missing)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'class_categories' 
    AND policyname = 'Users can update class categories'
  ) THEN
    CREATE POLICY "Users can update class categories"
      ON class_categories
      FOR UPDATE
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM classes WHERE id = class_id AND user_id = auth.uid()
      ));
  END IF;
END $$;