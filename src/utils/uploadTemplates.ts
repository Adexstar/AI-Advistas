import { supabase } from '@/integrations/supabase/client';

interface TemplateUploadData {
  file: File;
  name: string;
  description: string;
  category: 'social_media' | 'business' | 'agency_marketing';
  dimensions: { width: number; height: number };
}

export const uploadTemplateFiles = async () => {
  const templates: TemplateUploadData[] = [
    {
      file: await fetch('/src/assets/templates/9400515.jpg').then(r => r.blob()).then(b => new File([b], '9400515.jpg', { type: 'image/jpeg' })),
      name: 'Social Media Mission Posts',
      description: 'Professional social media post templates for missions and community service campaigns with consistent branding',
      category: 'social_media',
      dimensions: { width: 1080, height: 1080 }
    },
    {
      file: await fetch('/src/assets/templates/ebda9c57-3bab-4655-bf61-f1ac3012f700.jpg').then(r => r.blob()).then(b => new File([b], 'social-media-growth.jpg', { type: 'image/jpeg' })),
      name: 'Social Media Growth Ad',
      description: 'Modern advertising template for social media marketing services with professional styling and clear call-to-action',
      category: 'agency_marketing',
      dimensions: { width: 1080, height: 1080 }
    },
    {
      file: await fetch('/src/assets/templates/ebb66c23-e95d-4803-8252-d63c8fd534b7.jpg').then(r => r.blob()).then(b => new File([b], 'digital-marketing-agency.jpg', { type: 'image/jpeg' })),
      name: 'Digital Marketing Agency Flyer',
      description: 'Creative agency flyer template showcasing digital marketing services with vibrant orange branding',
      category: 'agency_marketing',
      dimensions: { width: 1080, height: 1080 }
    },
    {
      file: await fetch('/src/assets/templates/4742769.jpg').then(r => r.blob()).then(b => new File([b], 'sports-running-collection.jpg', { type: 'image/jpeg' })),
      name: 'Sports & Running Ad Collection',
      description: 'Professional fitness and sports event templates featuring running marathons, gym promotions, and athletic equipment ads',
      category: 'business',
      dimensions: { width: 1080, height: 1350 }
    },
    {
      file: await fetch('/src/assets/templates/3491672.jpg').then(r => r.blob()).then(b => new File([b], 'yoga-wellness-collection.jpg', { type: 'image/jpeg' })),
      name: 'Yoga & Wellness Social Posts',
      description: 'Serene yoga and wellness social media templates perfect for studios, instructors, and health businesses with calming aesthetics',
      category: 'social_media',
      dimensions: { width: 1080, height: 1080 }
    }
  ];

  const results = [];

  for (const template of templates) {
    try {
      console.log(`Uploading template: ${template.name}`);
      
      // Create FormData for the upload
      const formData = new FormData();
      formData.append('file', template.file);
      formData.append('metadata', JSON.stringify({
        name: template.name,
        description: template.description,
        dimensions: template.dimensions,
        category: template.category
      }));

      // Upload via edge function
      const { data, error } = await supabase.functions.invoke('upload-template', {
        body: formData
      });

      if (error) {
        console.error(`Error uploading ${template.name}:`, error);
        results.push({ name: template.name, success: false, error: error.message });
      } else {
        console.log(`Successfully uploaded ${template.name}:`, data);
        results.push({ name: template.name, success: true, data });
      }
    } catch (error) {
      console.error(`Exception uploading ${template.name}:`, error);
      results.push({ name: template.name, success: false, error: error.message });
    }
  }

  return results;
};