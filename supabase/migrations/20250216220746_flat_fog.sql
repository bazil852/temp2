/*
  # Add tool URL to AI tools

  1. Changes
    - Add tool_url column to ai_tools table
*/

ALTER TABLE ai_tools
ADD COLUMN tool_url TEXT NOT NULL DEFAULT '';

-- Remove the default after adding the column
ALTER TABLE ai_tools
ALTER COLUMN tool_url DROP DEFAULT;