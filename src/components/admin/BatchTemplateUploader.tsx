import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { uploadTemplateFiles } from '@/utils/uploadTemplates';
import { toast } from 'sonner';

export const BatchTemplateUploader: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<any[]>([]);

  const handleBatchUpload = async () => {
    setIsUploading(true);
    setUploadResults([]);
    
    try {
      toast.info('Starting template upload...');
      const results = await uploadTemplateFiles();
      setUploadResults(results);
      
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      if (successful > 0) {
        toast.success(`Successfully uploaded ${successful} templates!`);
      }
      if (failed > 0) {
        toast.error(`Failed to upload ${failed} templates`);
      }
    } catch (error) {
      console.error('Batch upload error:', error);
      toast.error('Failed to upload templates');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Batch Template Upload
        </CardTitle>
        <CardDescription>
          Upload the initial template collection with proper categorization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleBatchUpload} 
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading Templates...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Templates
            </>
          )}
        </Button>

        {uploadResults.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Upload Results:</h3>
            {uploadResults.map((result, index) => (
              <div key={index} className="flex items-center gap-2 p-2 rounded border">
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="flex-1">{result.name}</span>
                {!result.success && (
                  <span className="text-xs text-red-500">{result.error}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};