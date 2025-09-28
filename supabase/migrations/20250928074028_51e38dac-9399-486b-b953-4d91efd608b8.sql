-- Update existing templates with better thumbnail images
UPDATE templates 
SET thumbnail_url = CASE 
  WHEN name = 'Social Media Post' THEN 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=400&fit=crop&crop=center'
  WHEN name = 'Banner Ad' THEN 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=200&fit=crop&crop=center'
  WHEN name = 'TikTok Video' THEN 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=300&fit=crop&crop=center'
  WHEN name = 'Facebook Post' THEN 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop&crop=center'
  WHEN name = 'LinkedIn Post' THEN 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&crop=center'
  WHEN name = 'YouTube Thumbnail' THEN 'https://images.unsplash.com/photo-1611224923851-80b023f02d71?w=400&h=300&fit=crop&crop=center'
  ELSE thumbnail_url
END
WHERE template_source = 'internal';

-- Insert additional sample templates with better thumbnails
INSERT INTO templates (name, description, template_source, thumbnail_url, preview_url, schema) VALUES
('E-commerce Product', 'Perfect for showcasing products with compelling copy', 'internal', 
 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop&crop=center',
 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop&crop=center',
 '{
   "fields": [
     {"name": "product_name", "label": "Product Name", "type": "text", "default": "Amazing Product"},
     {"name": "price", "label": "Price", "type": "text", "default": "$99.99"},
     {"name": "description", "label": "Product Description", "type": "textarea", "default": "Transform your life with this incredible product"},
     {"name": "cta", "label": "Call to Action", "type": "text", "default": "Buy Now"},
     {"name": "product_image", "label": "Product Image", "type": "image", "default": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300"}
   ],
   "layout": {
     "product_name": {"x": 30, "y": 20, "fontSize": 24, "fontWeight": "bold", "color": "#000"},
     "price": {"x": 30, "y": 60, "fontSize": 32, "fontWeight": "bold", "color": "#e74c3c"},
     "description": {"x": 30, "y": 100, "fontSize": 16, "color": "#333"},
     "cta": {"x": 30, "y": 200, "fontSize": 18, "color": "#fff", "backgroundColor": "#e74c3c", "padding": "12px 24px"},
     "product_image": {"x": 250, "y": 20, "width": 200, "height": 200}
   }
 }'),
('App Promotion', 'Perfect for mobile app downloads and features', 'internal',
 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=300&fit=crop&crop=center',
 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=300&fit=crop&crop=center',
 '{
   "fields": [
     {"name": "app_name", "label": "App Name", "type": "text", "default": "SuperApp"},
     {"name": "tagline", "label": "Tagline", "type": "text", "default": "The Ultimate Mobile Experience"},
     {"name": "features", "label": "Key Features", "type": "textarea", "default": "• Fast & Reliable\n• User-Friendly\n• Secure"},
     {"name": "cta", "label": "Call to Action", "type": "text", "default": "Download Now"},
     {"name": "app_icon", "label": "App Icon", "type": "image", "default": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=100&h=100"}
   ],
   "layout": {
     "app_name": {"x": 30, "y": 20, "fontSize": 28, "fontWeight": "bold", "color": "#000"},
     "tagline": {"x": 30, "y": 60, "fontSize": 16, "color": "#666"},
     "features": {"x": 30, "y": 100, "fontSize": 14, "color": "#333"},
     "cta": {"x": 30, "y": 200, "fontSize": 18, "color": "#fff", "backgroundColor": "#3498db", "padding": "12px 24px"},
     "app_icon": {"x": 300, "y": 20, "width": 100, "height": 100}
   }
 }'),
('Event Promotion', 'Great for conferences, webinars, and events', 'internal',
 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop&crop=center',
 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop&crop=center',
 '{
   "fields": [
     {"name": "event_name", "label": "Event Name", "type": "text", "default": "Amazing Conference 2024"},
     {"name": "date", "label": "Date & Time", "type": "text", "default": "March 15, 2024 | 9:00 AM"},
     {"name": "location", "label": "Location", "type": "text", "default": "Convention Center, NYC"},
     {"name": "description", "label": "Event Description", "type": "textarea", "default": "Join industry leaders for an unforgettable experience"},
     {"name": "cta", "label": "Call to Action", "type": "text", "default": "Register Now"}
   ],
   "layout": {
     "event_name": {"x": 30, "y": 20, "fontSize": 26, "fontWeight": "bold", "color": "#000"},
     "date": {"x": 30, "y": 60, "fontSize": 16, "fontWeight": "bold", "color": "#e74c3c"},
     "location": {"x": 30, "y": 85, "fontSize": 14, "color": "#666"},
     "description": {"x": 30, "y": 120, "fontSize": 16, "color": "#333"},
     "cta": {"x": 30, "y": 200, "fontSize": 18, "color": "#fff", "backgroundColor": "#f39c12", "padding": "12px 24px"}
   }
 }');