/*
  # Add debugging functions and safeguards

  1. Changes
    - Add function to verify category ownership
    - Add function to clean up orphaned junction entries
    - Add trigger to log category deletions
*/

-- Create a table for deletion logs
CREATE TABLE category_deletion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL,
  category_type TEXT NOT NULL,
  user_id UUID NOT NULL,
  deleted_at TIMESTAMPTZ DEFAULT now(),
  success BOOLEAN,
  error_message TEXT
);

-- Enable RLS
ALTER TABLE category_deletion_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing logs
CREATE POLICY "Users can view their own deletion logs"
  ON category_deletion_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Function to verify category ownership
CREATE OR REPLACE FUNCTION verify_category_ownership(
  category_table text,
  category_id uuid,
  user_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  owner_id uuid;
BEGIN
  EXECUTE format('
    SELECT user_id 
    FROM %I 
    WHERE id = $1
  ', category_table)
  INTO owner_id
  USING category_id;
  
  RETURN owner_id = user_id;
END;
$$;

-- Function to clean up orphaned junction entries
CREATE OR REPLACE FUNCTION cleanup_category_junctions(
  category_table text,
  category_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clean up AI tool categories
  IF category_table = 'ai_categories' THEN
    DELETE FROM ai_tool_categories WHERE category_id = $2;
  -- Clean up class categories
  ELSIF category_table = 'categories' THEN
    DELETE FROM class_categories WHERE category_id = $2;
  -- Clean up blueprint categories
  ELSIF category_table = 'automation_categories' THEN
    DELETE FROM blueprint_categories WHERE category_id = $2;
  END IF;
END;
$$;

-- Trigger function to log category deletions
CREATE OR REPLACE FUNCTION log_category_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO category_deletion_logs (
    category_id,
    category_type,
    user_id,
    success,
    error_message
  )
  VALUES (
    OLD.id,
    TG_TABLE_NAME,
    auth.uid(),
    TRUE,
    NULL
  );
  RETURN OLD;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO category_deletion_logs (
    category_id,
    category_type,
    user_id,
    success,
    error_message
  )
  VALUES (
    OLD.id,
    TG_TABLE_NAME,
    auth.uid(),
    FALSE,
    SQLERRM
  );
  RAISE;
END;
$$;

-- Add deletion triggers to category tables
CREATE TRIGGER log_ai_category_deletion
  BEFORE DELETE ON ai_categories
  FOR EACH ROW
  EXECUTE FUNCTION log_category_deletion();

CREATE TRIGGER log_class_category_deletion
  BEFORE DELETE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION log_category_deletion();

CREATE TRIGGER log_automation_category_deletion
  BEFORE DELETE ON automation_categories
  FOR EACH ROW
  EXECUTE FUNCTION log_category_deletion();