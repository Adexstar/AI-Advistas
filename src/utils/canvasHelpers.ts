export const detectEditableFields = (canvasData: any) => {
  const fields: any[] = [];
  
  if (!canvasData.objects) return fields;
  
  canvasData.objects.forEach((obj: any, index: number) => {
    if (obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text') {
      fields.push({
        type: 'text',
        label: obj.text?.slice(0, 20) || `Text ${index + 1}`,
        path: `objects[${index}].text`,
        objectIndex: index
      });
    }
    
    if (obj.type === 'image') {
      fields.push({
        type: 'image',
        label: `Image ${index + 1}`,
        path: `objects[${index}].src`,
        objectIndex: index
      });
    }
  });
  
  return fields;
};

export const generateDefaultCanvasData = (template: any) => {
  return {
    version: '6.0.0',
    objects: [
      {
        type: 'textbox',
        text: template.template_json?.product || template.name || 'Your Product',
        left: 50,
        top: 50,
        fontSize: 32,
        fontFamily: 'Inter',
        fill: '#000000',
        width: 700
      },
      {
        type: 'textbox',
        text: template.template_json?.details || template.description || 'Add your details here',
        left: 50,
        top: 120,
        fontSize: 16,
        fontFamily: 'Inter',
        fill: '#666666',
        width: 700
      }
    ],
    background: '#ffffff'
  };
};
