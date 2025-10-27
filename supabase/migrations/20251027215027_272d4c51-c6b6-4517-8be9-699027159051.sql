-- Add external source tracking and WYSIWYG fields to ad_templates
ALTER TABLE ad_templates
  ADD COLUMN IF NOT EXISTS template_source text DEFAULT 'internal' 
    CHECK (template_source IN ('internal', 'freepik', 'canva', 'figma')),
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS customizable_fields jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS canvas_data jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS preview_variants jsonb DEFAULT '{}'::jsonb;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_template_source ON ad_templates(template_source);
CREATE INDEX IF NOT EXISTS idx_external_id ON ad_templates(external_id);

-- Backfill existing templates with default canvas_data
UPDATE ad_templates 
SET canvas_data = jsonb_build_object(
  'version', '6.0.0',
  'objects', jsonb_build_array(
    jsonb_build_object(
      'type', 'textbox',
      'text', COALESCE(template_json->>'product', name, 'Your Product'),
      'left', 50,
      'top', 50,
      'fontSize', 32,
      'fontFamily', 'Inter',
      'fill', '#000000',
      'width', 700
    ),
    jsonb_build_object(
      'type', 'textbox',
      'text', COALESCE(template_json->>'details', description, 'Add your details here'),
      'left', 50,
      'top', 120,
      'fontSize', 16,
      'fontFamily', 'Inter',
      'fill', '#666666',
      'width', 700
    )
  ),
  'background', '#ffffff'
)
WHERE canvas_data = '{}'::jsonb OR canvas_data IS NULL;

-- Auto-detect customizable fields for existing templates
UPDATE ad_templates
SET customizable_fields = jsonb_build_array(
  jsonb_build_object(
    'type', 'text',
    'label', 'Product Name',
    'path', 'objects[0].text',
    'objectIndex', 0
  ),
  jsonb_build_object(
    'type', 'text',
    'label', 'Details',
    'path', 'objects[1].text',
    'objectIndex', 1
  )
)
WHERE customizable_fields = '[]'::jsonb OR customizable_fields IS NULL;