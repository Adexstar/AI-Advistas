import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, FileImage, FileText } from 'lucide-react';
import { useUploadTemplate } from '@/hooks/useTemplateStorage';
import { cn } from '@/lib/utils';

interface TemplateUploaderProps {
  onUploadComplete?: () => void;
}

export const TemplateUploader: React.FC<TemplateUploaderProps> = ({ onUploadComplete }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [metadata, setMetadata] = useState({
    name: '',
    description: '',
    dimensions: { width: 0, height: 0 }
  });
  const [isDragOver, setIsDragOver] = useState(false);

  const uploadTemplate = useUploadTemplate();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/') || 
      file.type === 'application/x-photoshop' ||
      file.name.toLowerCase().endsWith('.psd')
    );
    
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0 || !metadata.name.trim()) return;

    try {
      for (const file of files) {
        await uploadTemplate.mutateAsync({
          file,
          metadata: {
            ...metadata,
            name: `${metadata.name} - ${file.name}`
          }
        });
      }
      
      // Reset form
      setFiles([]);
      setMetadata({ name: '', description: '', dimensions: { width: 0, height: 0 } });
      onUploadComplete?.();
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return FileImage;
    if (file.type === 'application/x-photoshop' || file.name.toLowerCase().endsWith('.psd')) return FileText;
    return FileText;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Templates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Area */}
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            "hover:border-primary hover:bg-primary/5"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">Drop template files here</p>
          <p className="text-sm text-muted-foreground mb-4">
            Supports PSD, JPG, PNG, SVG files
          </p>
          <Button variant="outline" onClick={() => document.getElementById('file-input')?.click()}>
            Choose Files
          </Button>
          <input
            id="file-input"
            type="file"
            multiple
            accept=".psd,.jpg,.jpeg,.png,.svg,image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="space-y-2">
            <Label>Selected Files ({files.length})</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {files.map((file, index) => {
                const Icon = getFileIcon(file);
                return (
                  <div key={index} className="flex items-center gap-3 p-2 border rounded">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Metadata Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name *</Label>
            <Input
              id="template-name"
              placeholder="Enter template name"
              value={metadata.name}
              onChange={(e) => setMetadata(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              placeholder="Describe the template"
              value={metadata.description}
              onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">Width (px)</Label>
              <Input
                id="width"
                type="number"
                placeholder="1920"
                value={metadata.dimensions.width || ''}
                onChange={(e) => setMetadata(prev => ({ 
                  ...prev, 
                  dimensions: { ...prev.dimensions, width: parseInt(e.target.value) || 0 }
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (px)</Label>
              <Input
                id="height"
                type="number"
                placeholder="1080"
                value={metadata.dimensions.height || ''}
                onChange={(e) => setMetadata(prev => ({ 
                  ...prev, 
                  dimensions: { ...prev.dimensions, height: parseInt(e.target.value) || 0 }
                }))}
              />
            </div>
          </div>
        </div>

        {/* Upload Button */}
        <Button
          className="w-full"
          onClick={handleUpload}
          disabled={files.length === 0 || !metadata.name.trim() || uploadTemplate.isPending}
        >
          {uploadTemplate.isPending ? 'Uploading...' : `Upload ${files.length} Template${files.length !== 1 ? 's' : ''}`}
        </Button>
      </CardContent>
    </Card>
  );
};