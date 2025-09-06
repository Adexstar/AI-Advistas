import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Upload, 
  Play, 
  Pause, 
  Download, 
  Share2, 
  RefreshCw, 
  Trash2, 
  Edit3,
  Video,
  Image,
  Sparkles,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  CheckCircle2,
  Clock,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type VideoStatus = 'processing' | 'completed' | 'failed';
type PlatformStyle = 'tiktok' | 'instagram' | 'youtube' | 'facebook' | 'custom';
type VideoStyle = 'product-showcase' | 'promo-sale' | 'testimonial' | 'minimalist';

interface GeneratedVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  status: VideoStatus;
  createdAt: Date;
  platform: PlatformStyle;
  style: VideoStyle;
}

const AIVideoGenerator = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  // Form data
  const [headline, setHeadline] = useState("");
  const [cta, setCta] = useState("");
  const [platformStyle, setPlatformStyle] = useState<PlatformStyle>("instagram");
  const [videoStyle, setVideoStyle] = useState<VideoStyle>("product-showcase");
  const [music, setMusic] = useState("upbeat");
  const [voiceover, setVoiceover] = useState("none");
  const [autoSubtitles, setAutoSubtitles] = useState(true);

  // Mock data for saved ads
  const [savedVideos] = useState<GeneratedVideo[]>([
    {
      id: '1',
      title: 'Summer Collection Launch',
      thumbnail: '/placeholder.svg',
      duration: 15,
      status: 'completed',
      createdAt: new Date(Date.now() - 86400000),
      platform: 'instagram',
      style: 'product-showcase'
    },
    {
      id: '2',
      title: 'Black Friday Sale',
      thumbnail: '/placeholder.svg',
      duration: 30,
      status: 'processing',
      createdAt: new Date(Date.now() - 3600000),
      platform: 'tiktok',
      style: 'promo-sale'
    },
    {
      id: '3',
      title: 'Customer Testimonial',
      thumbnail: '/placeholder.svg',
      duration: 20,
      status: 'completed',
      createdAt: new Date(Date.now() - 7200000),
      platform: 'youtube',
      style: 'testimonial'
    }
  ]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      toast({
        title: "Files uploaded",
        description: `${validFiles.length} file(s) added successfully.`
      });
    }
  }, [toast]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...uploadedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const generateVideo = async () => {
    if (files.length === 0) {
      toast({
        title: "No files uploaded",
        description: "Please upload at least one image or video file.",
        variant: "destructive"
      });
      return;
    }

    if (!headline.trim()) {
      toast({
        title: "Missing headline",
        description: "Please add a headline for your ad.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    // Simulate AI video generation process
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    setTimeout(() => {
      setIsGenerating(false);
      setGenerationProgress(0);
      setCurrentVideo("https://via.placeholder.com/640x360/6366f1/ffffff?text=Generated+Video");
      toast({
        title: "Video generated successfully!",
        description: "Your AI-powered ad video is ready to preview."
      });
    }, 8000);
  };

  const shareToSocialMedia = (platform: string) => {
    toast({
      title: `Sharing to ${platform}`,
      description: "Video will be posted to your connected account."
    });
  };

  const getPlatformIcon = (platform: PlatformStyle) => {
    const icons = {
      tiktok: Video,
      instagram: Instagram,
      youtube: Youtube,
      facebook: Facebook,
      custom: Sparkles
    };
    return icons[platform];
  };

  const getStatusIcon = (status: VideoStatus) => {
    const icons = {
      processing: Clock,
      completed: CheckCircle2,
      failed: Trash2
    };
    return icons[status];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full mr-4">
              <Video className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              AI Video Generator
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Turn your photos or clips into stunning ad-style videos using AI. Perfect for e-commerce, social media campaigns, and product promotions.
          </p>
          
          {/* Analytics Card */}
          <div className="flex items-center justify-center mt-6">
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="flex items-center space-x-6 p-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <p className="text-sm font-semibold">Generated Ads</p>
                    <p className="text-2xl font-bold text-primary">24</p>
                  </div>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="text-left">
                  <p className="text-sm font-semibold">Avg. Duration</p>
                  <p className="text-2xl font-bold text-primary">15s</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload & Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 space-y-6"
          >
            <Card className="shadow-lg border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Drag & Drop Zone */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm font-medium mb-2">Drag & drop files here</p>
                  <p className="text-xs text-muted-foreground mb-4">Images and videos supported</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button variant="outline" asChild>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      Choose Files
                    </label>
                  </Button>
                </div>

                {/* Uploaded Files */}
                {files.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Uploaded Files</Label>
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <div className="flex items-center">
                          {file.type.startsWith('image/') ? 
                            <Image className="h-4 w-4 mr-2" /> : 
                            <Video className="h-4 w-4 mr-2" />
                          }
                          <span className="text-sm truncate">{file.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                          className="h-6 w-6"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Text Inputs */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="headline">Ad Headline</Label>
                    <Input
                      id="headline"
                      placeholder="Enter your compelling headline..."
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cta">Call to Action</Label>
                    <Input
                      id="cta"
                      placeholder="Shop Now, Learn More, Sign Up..."
                      value={cta}
                      onChange={(e) => setCta(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Platform Style</Label>
                    <Select value={platformStyle} onValueChange={(value: PlatformStyle) => setPlatformStyle(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tiktok">TikTok (9:16)</SelectItem>
                        <SelectItem value="instagram">Instagram (1:1)</SelectItem>
                        <SelectItem value="youtube">YouTube (16:9)</SelectItem>
                        <SelectItem value="facebook">Facebook (16:9)</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Options */}
            <Card className="shadow-lg border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="mr-2 h-5 w-5" />
                  AI Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Video Style</Label>
                  <Select value={videoStyle} onValueChange={(value: VideoStyle) => setVideoStyle(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product-showcase">Product Showcase</SelectItem>
                      <SelectItem value="promo-sale">Promo / Sale</SelectItem>
                      <SelectItem value="testimonial">Testimonial Style</SelectItem>
                      <SelectItem value="minimalist">Minimalist Ad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Background Music</Label>
                  <Select value={music} onValueChange={setMusic}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upbeat">Upbeat & Energetic</SelectItem>
                      <SelectItem value="calm">Calm & Professional</SelectItem>
                      <SelectItem value="trendy">Trendy & Modern</SelectItem>
                      <SelectItem value="none">No Music</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>AI Voiceover</Label>
                  <Select value={voiceover} onValueChange={setVoiceover}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Voiceover</SelectItem>
                      <SelectItem value="female">Female Voice</SelectItem>
                      <SelectItem value="male">Male Voice</SelectItem>
                      <SelectItem value="neutral">Neutral Voice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="subtitles">Auto Add Subtitles</Label>
                  <Switch
                    id="subtitles"
                    checked={autoSubtitles}
                    onCheckedChange={setAutoSubtitles}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Preview & Generation Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Generation Controls */}
            <Card className="shadow-lg border-primary/10">
              <CardContent className="p-6">
                {!isGenerating && !currentVideo && (
                  <div className="text-center">
                    <Button
                      onClick={generateVideo}
                      size="lg"
                      className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                      disabled={files.length === 0 || !headline.trim()}
                    >
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate AI Video
                    </Button>
                  </div>
                )}

                {isGenerating && (
                  <div className="text-center space-y-4">
                    <div className="animate-spin mx-auto">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium">Generating your AI video...</p>
                      <Progress value={generationProgress} className="w-full" />
                      <p className="text-sm text-muted-foreground">
                        {generationProgress < 30 && "Analyzing your content..."}
                        {generationProgress >= 30 && generationProgress < 60 && "Applying AI effects..."}
                        {generationProgress >= 60 && generationProgress < 90 && "Adding music and transitions..."}
                        {generationProgress >= 90 && "Finalizing your video..."}
                      </p>
                    </div>
                  </div>
                )}

                {currentVideo && !isGenerating && (
                  <div className="space-y-4">
                    {/* Video Preview */}
                    <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl">
                      <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <div className="text-center text-white">
                          <Play className="h-16 w-16 mx-auto mb-4 opacity-80" />
                          <p className="text-lg font-semibold">Generated Video Preview</p>
                          <p className="text-sm opacity-75">Click to play</p>
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={() => setIsPlaying(!isPlaying)}
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <div className="flex space-x-2">
                          <Button variant="secondary" size="sm">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Regenerate
                          </Button>
                          <Button variant="secondary" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Social Media Sharing */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Share to Social Media</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <Button
                            variant="outline"
                            onClick={() => shareToSocialMedia('Facebook')}
                            className="flex items-center justify-center space-x-2"
                          >
                            <Facebook className="h-4 w-4" />
                            <span>Facebook</span>
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => shareToSocialMedia('Instagram')}
                            className="flex items-center justify-center space-x-2"
                          >
                            <Instagram className="h-4 w-4" />
                            <span>Instagram</span>
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => shareToSocialMedia('Twitter')}
                            className="flex items-center justify-center space-x-2"
                          >
                            <Twitter className="h-4 w-4" />
                            <span>Twitter</span>
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => shareToSocialMedia('YouTube')}
                            className="flex items-center justify-center space-x-2"
                          >
                            <Youtube className="h-4 w-4" />
                            <span>YouTube</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Saved Ads Section */}
            <Card className="shadow-lg border-primary/10">
              <CardHeader>
                <CardTitle>Your Generated Videos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedVideos.map((video) => {
                    const StatusIcon = getStatusIcon(video.status);
                    const PlatformIcon = getPlatformIcon(video.platform);
                    
                    return (
                      <div key={video.id} className="group">
                        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                          <div className="relative">
                            <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                              <Play className="h-8 w-8 text-muted-foreground opacity-50" />
                            </div>
                            <div className="absolute top-2 right-2">
                              <Badge 
                                variant={video.status === 'completed' ? 'default' : video.status === 'processing' ? 'secondary' : 'destructive'}
                                className="text-xs"
                              >
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {video.status}
                              </Badge>
                            </div>
                            <div className="absolute bottom-2 left-2">
                              <Badge variant="outline" className="text-xs bg-background/80">
                                {video.duration}s
                              </Badge>
                            </div>
                          </div>
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm truncate">{video.title}</h4>
                              <PlatformIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="text-xs text-muted-foreground mb-3">
                              {video.createdAt.toLocaleDateString()}
                            </p>
                            <div className="flex space-x-1">
                              <Button variant="outline" size="sm" className="flex-1">
                                <Play className="h-3 w-3 mr-1" />
                                Play
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Share2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AIVideoGenerator;