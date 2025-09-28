import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Download, Copy, Share2, Smartphone, Monitor, Tablet } from 'lucide-react';
import { useVisualEditor } from '@/contexts/VisualEditorContext';
import { useExportAd, useQuickExport } from '@/hooks/useExportAd';
import { useSaveUserAd } from '@/hooks/useTemplateStorage';

export const ExportPanel: React.FC = () => {
  const { fabricCanvas } = useVisualEditor();
  const [format, setFormat] = useState<'png' | 'jpg' | 'pdf' | 'svg'>('png');
  const [quality, setQuality] = useState(90);
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });
  const [adName, setAdName] = useState('');

  const exportAd = useExportAd();
  const quickExport = useQuickExport();
  const saveUserAd = useSaveUserAd();

  const presets = [
    { name: 'Instagram Square', width: 1080, height: 1080, icon: Smartphone },
    { name: 'Instagram Story', width: 1080, height: 1920, icon: Smartphone },
    { name: 'Facebook Post', width: 1200, height: 630, icon: Monitor },
    { name: 'Twitter Header', width: 1500, height: 500, icon: Monitor },
    { name: 'LinkedIn Post', width: 1200, height: 627, icon: Monitor },
    { name: 'YouTube Thumbnail', width: 1280, height: 720, icon: Tablet },
  ];

  const handleSaveAd = async () => {
    if (!fabricCanvas || !adName.trim()) return;

    try {
      const canvasData = fabricCanvas.toObject();
      await saveUserAd.mutateAsync({
        name: adName,
        content: canvasData,
        status: 'completed'
      });
      setAdName('');
    } catch (error) {
      console.error('Failed to save ad:', error);
    }
  };

  const handleExport = async () => {
    if (!fabricCanvas) return;

    const tempAdId = `temp_${Date.now()}`;
    await exportAd.mutateAsync({
      canvas: fabricCanvas,
      adId: tempAdId,
      options: {
        format,
        quality: quality / 100,
        width: dimensions.width,
        height: dimensions.height
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Save Ad */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Save Ad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ad-name">Ad Name</Label>
            <Input
              id="ad-name"
              placeholder="Enter ad name"
              value={adName}
              onChange={(e) => setAdName(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleSaveAd} 
            disabled={!adName.trim() || saveUserAd.isPending}
            className="w-full"
          >
            {saveUserAd.isPending ? 'Saving...' : 'Save to My Ads'}
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            onClick={() => quickExport.exportAsPNG(fabricCanvas!)}
            disabled={!fabricCanvas}
            className="w-full flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download PNG
          </Button>
          <Button 
            variant="outline" 
            onClick={() => quickExport.exportAsJPG(fabricCanvas!)}
            disabled={!fabricCanvas}
            className="w-full flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download JPG
          </Button>
          <Button 
            variant="outline" 
            onClick={() => quickExport.copyToClipboard(fabricCanvas!)}
            disabled={!fabricCanvas}
            className="w-full flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy to Clipboard
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Advanced Export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Advanced Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Format</Label>
            <Select value={format} onValueChange={(value: any) => setFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG (Best Quality)</SelectItem>
                <SelectItem value="jpg">JPG (Smaller Size)</SelectItem>
                <SelectItem value="pdf">PDF (Print Ready)</SelectItem>
                <SelectItem value="svg">SVG (Vector)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quality Slider */}
          {(format === 'jpg' || format === 'png') && (
            <div className="space-y-2">
              <Label>Quality: {quality}%</Label>
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          {/* Preset Dimensions */}
          <div className="space-y-3">
            <Label>Presets</Label>
            <div className="grid grid-cols-1 gap-2">
              {presets.map((preset) => {
                const Icon = preset.icon;
                return (
                  <Button
                    key={preset.name}
                    variant="outline"
                    size="sm"
                    onClick={() => setDimensions({ width: preset.width, height: preset.height })}
                    className="justify-start"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    <span className="flex-1 text-left">{preset.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {preset.width}×{preset.height}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Custom Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">Width (px)</Label>
              <Input
                id="width"
                type="number"
                value={dimensions.width}
                onChange={(e) => setDimensions(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (px)</Label>
              <Input
                id="height"
                type="number"
                value={dimensions.height}
                onChange={(e) => setDimensions(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <Button 
            onClick={handleExport} 
            disabled={!fabricCanvas || exportAd.isPending}
            className="w-full"
          >
            {exportAd.isPending ? 'Exporting...' : `Export as ${format.toUpperCase()}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};