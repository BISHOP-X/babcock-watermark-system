import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Settings, Eye, Download, Palette, Type, Move, Sliders } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/Header";
import { WatermarkPreview } from "@/components/WatermarkPreview";
import { useToast } from "@/hooks/use-toast";

interface WatermarkSettings {
  text: string;
  opacity: number;
  fontSize: 'small' | 'medium' | 'large';
  color: string;
  applyToAll: boolean;
}

const WatermarkConfig = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get files from previous step (would normally come from state management)
  const uploadedFiles = location.state?.files || [];
  
  const [settings, setSettings] = useState<WatermarkSettings>({
    text: "College of Postgraduate School, BU",
    opacity: 30,
    fontSize: 'medium',
    color: '#1e40af',
    applyToAll: true
  });

  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "No files found",
        description: "Please upload files first before configuring watermarks.",
        variant: "destructive",
      });
      navigate('/upload');
    }
  }, [uploadedFiles, navigate, toast]);

  const handleSettingChange = (key: keyof WatermarkSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePreviewUpdate = () => {
    setIsPreviewLoading(true);
    // Simulate preview generation
    setTimeout(() => {
      setIsPreviewLoading(false);
    }, 800);
  };

  const handleNext = () => {
    navigate('/processing', { 
      state: { 
        files: uploadedFiles, 
        watermarkSettings: settings 
      } 
    });
  };

  const colorOptions = [
    { label: 'University Blue', value: '#1e40af' },
    { label: 'Dark Gray', value: '#374151' },
    { label: 'Black', value: '#000000' },
    { label: 'Red', value: '#dc2626' },
  ];

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/upload')}
              className="hover:bg-primary-light"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Upload
            </Button>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Configure Watermark Settings
          </h1>
          <p className="text-muted-foreground text-lg">
            Customize how the CPGS watermark will appear on your documents
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Settings Panel */}
          <div className="space-y-6 animate-slide-up">
            <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Watermark Configuration
                </CardTitle>
                <CardDescription>
                  Adjust the appearance and settings for your watermark
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Watermark Text */}
                <div className="space-y-2">
                  <Label htmlFor="watermark-text" className="flex items-center gap-2">
                    <Type className="h-4 w-4 text-primary" />
                    Watermark Text
                  </Label>
                  <Input
                    id="watermark-text"
                    value={settings.text}
                    onChange={(e) => handleSettingChange('text', e.target.value)}
                    placeholder="Enter watermark text"
                    className="font-medium"
                  />
                </div>

                <Separator />

                {/* Opacity Control */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-primary" />
                    Opacity: {settings.opacity}%
                  </Label>
                  <Slider
                    value={[settings.opacity]}
                    onValueChange={(value) => handleSettingChange('opacity', value[0])}
                    min={10}
                    max={70}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>10% (Light)</span>
                    <span>70% (Dark)</span>
                  </div>
                </div>

                <Separator />

                {/* Font Size */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Type className="h-4 w-4 text-primary" />
                    Font Size
                  </Label>
                  <Select 
                    value={settings.fontSize} 
                    onValueChange={(value: 'small' | 'medium' | 'large') => 
                      handleSettingChange('fontSize', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Color Selection */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-primary" />
                    Watermark Color
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {colorOptions.map((color) => (
                      <Button
                        key={color.value}
                        variant={settings.color === color.value ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => handleSettingChange('color', color.value)}
                      >
                        <div 
                          className="w-4 h-4 rounded-full mr-2" 
                          style={{ backgroundColor: color.value }}
                        />
                        {color.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Apply to All Files */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      <Move className="h-4 w-4 text-primary" />
                      Apply to All Files
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Use these settings for all {uploadedFiles.length} documents
                    </p>
                  </div>
                  <Switch
                    checked={settings.applyToAll}
                    onCheckedChange={(checked) => handleSettingChange('applyToAll', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={handlePreviewUpdate}
                disabled={isPreviewLoading}
                className="flex-1"
              >
                <Eye className="mr-2 h-4 w-4" />
                {isPreviewLoading ? 'Updating...' : 'Update Preview'}
              </Button>
              
              <Button 
                onClick={handleNext}
                className="flex-1 bg-gradient-primary hover:scale-[1.02] transition-transform duration-200 shadow-elevated"
                size="lg"
              >
                Next Step
                <Download className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Preview Area */}
          <div className="animate-scale-in" style={{ animationDelay: "200ms" }}>
            <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Live Preview
                </CardTitle>
                <CardDescription>
                  See how your watermark will appear on documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WatermarkPreview 
                  settings={settings} 
                  isLoading={isPreviewLoading}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WatermarkConfig;