/*
  # Add support for multiple categories

  1. New Tables
    - `ai_tool_categories`: Junction table for AI tools and categories
    - `class_categories`: Junction table for classes and categories
    - `blueprint_categories`: Junction table for blueprints and categories

  2. Changes
    - Remove single category_id columns
    - Update existing data to maintain relationships
*/

-- Create junction tables
CREATE TABLE ai_tool_categories (
  tool_id UUID REFERENCES ai_tools(id) ON DELETE CASCADE,
  category_id UUID REFERENCES ai_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (tool_id, category_id)
);

CREATE TABLE class_categories (
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (class_id, category_id)
);

CREATE TABLE blueprint_categories (
  blueprint_id UUID REFERENCES blueprints(id) ON DELETE CASCADE,
  category_id UUID REFERENCES automation_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (blueprint_id, category_id)
);

-- Enable RLS
ALTER TABLE ai_tool_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprint_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read tool categories"
  ON ai_tool_categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create tool categories"
  ON ai_tool_categories FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM ai_tools WHERE id = tool_id AND user_id = auth.uid()
  ));

CREATE POLICY "Anyone can read class categories"
  ON class_categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create class categories"
  ON class_categories FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM classes WHERE id = class_id AND user_id = auth.uid()
  ));

CREATE POLICY "Anyone can read blueprint categories"
  ON blueprint_categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create blueprint categories"
  ON blueprint_categories FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM blueprints WHERE id = blueprint_id AND user_id = auth.uid()
  ));

-- Migrate existing data
INSERT INTO ai_tool_categories (tool_id, category_id)
SELECT id, category_id FROM ai_tools WHERE category_id IS NOT NULL;

INSERT INTO class_categories (class_id, category_id)
SELECT id, category_id FROM classes WHERE category_id IS NOT NULL;

INSERT INTO blueprint_categories (blueprint_id, category_id)
SELECT id, category_id FROM blueprints WHERE category_id IS NOT NULL;

-- Remove old category_id columns
ALTER TABLE ai_tools DROP COLUMN category_id;
ALTER TABLE classes DROP COLUMN category_id;
ALTER TABLE blueprints DROP COLUMN category_id;