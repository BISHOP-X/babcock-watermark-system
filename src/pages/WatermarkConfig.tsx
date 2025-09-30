import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Settings, Eye, Download, Palette, Type, Move, Sliders, User, Users, Layers, RotateCw, Grid3X3, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/Header";
import { WatermarkPreview } from "@/components/WatermarkPreview";
import { useToast } from "@/hooks/use-toast";
import { apiService, WatermarkSettings } from "@/lib/api";

const WatermarkConfig = () => {
  const navigate = useNavigate();
  const { batchId } = useParams<{ batchId: string }>();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Check if this is single file mode
  const isSingleMode = searchParams.get('mode') === 'single';
  
  const [batchData, setBatchData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<WatermarkSettings>({
    text: "College of Postgraduate School, BU",
    opacity: 30,
    fontSize: 'medium',
    color: '#1e40af',
    // STAGE 5: Default advanced settings
    position: { type: 'center' },
    style: { 
      fontFamily: 'helvetica',
      rotation: -45 
    },
    transparency: { 
      type: 'uniform',
      value: 30 
    },
    pageSpecific: { 
      pageRange: 'all' 
    },
    template: 'custom'
  });

  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load batch data from API
  useEffect(() => {
    const loadBatchData = async () => {
      if (!batchId) {
        toast({
          title: "Invalid batch ID",
          description: "Please upload files first before configuring watermarks.",
          variant: "destructive",
        });
        navigate('/upload');
        return;
      }

      try {
        setIsLoading(true);
        console.log('📊 Loading batch data for:', batchId);
        
        const batch = await apiService.getBatch(batchId);
        setBatchData(batch);
        
        // Use existing watermark settings if available
        if (batch.watermarkSettings) {
          setSettings(batch.watermarkSettings);
        }
        
        console.log('✅ Batch data loaded:', batch);
        
      } catch (error) {
        console.error('❌ Failed to load batch data:', error);
        toast({
          title: "Failed to load batch",
          description: "Could not load batch information. Please try again.",
          variant: "destructive",
        });
        navigate('/upload');
      } finally {
        setIsLoading(false);
      }
    };

    loadBatchData();
  }, [batchId, navigate, toast]);

  const handleSettingChange = (key: keyof WatermarkSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasUnsavedChanges(true);
  };

  // STAGE 5: Enhanced setting handlers for nested objects
  const handlePositionChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      position: {
        ...prev.position,
        [key]: value
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handleStyleChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      style: {
        ...prev.style,
        [key]: value
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handleTransparencyChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      transparency: {
        ...prev.transparency,
        [key]: value
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handlePageSpecificChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      pageSpecific: {
        ...prev.pageSpecific,
        [key]: value
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handlePreviewUpdate = async () => {
    if (!batchId) return;
    
    setIsPreviewLoading(true);
    
    try {
      // Update batch with new watermark settings
      await apiService.updateBatchWatermarkSettings(batchId, settings);
      
      setHasUnsavedChanges(false);
      
      toast({
        title: "Settings updated",
        description: "Watermark settings have been saved and preview updated.",
      });
      
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast({
        title: "Update failed",
        description: "Failed to save watermark settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleNext = async () => {
    if (!batchId) return;
    
    try {
      // Save current settings to batch before proceeding
      if (hasUnsavedChanges) {
        await apiService.updateBatchWatermarkSettings(batchId, settings);
      }
      
      navigate(`/processing/${batchId}${isSingleMode ? '?mode=single' : ''}`);
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: "Save failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const colorOptions = [
    { label: 'University Blue', value: '#1e40af' },
    { label: 'Dark Gray', value: '#374151' },
    { label: 'Black', value: '#000000' },
    { label: 'Red', value: '#dc2626' },
  ];

  // Show loading state while fetching batch data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-secondary">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="text-muted-foreground">Loading batch information...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show error if no batch data
  if (!batchData) {
    return (
      <div className="min-h-screen bg-gradient-secondary">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Batch Not Found</h1>
            <p className="text-muted-foreground">The requested batch could not be found.</p>
            <Button onClick={() => navigate('/upload')}>Return to Upload</Button>
          </div>
        </main>
      </div>
    );
  }

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
          
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
            {isSingleMode ? (
              <>
                <User className="h-8 w-8 text-primary" />
                Configure Document Watermark
              </>
            ) : (
              <>
                <Users className="h-8 w-8 text-primary" />
                Configure Watermark Settings
              </>
            )}
          </h1>
          <p className="text-muted-foreground text-lg">
            {isSingleMode 
              ? 'Customize how the CPGS watermark will appear on your document'
              : 'Customize how the CPGS watermark will appear on your documents'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Enhanced Settings Panel with Tabs */}
          <div className="space-y-6 animate-slide-up">
            <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Advanced Watermark Configuration
                </CardTitle>
                <CardDescription>
                  Professional watermarking with advanced positioning, styling, and effects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic">Basic</TabsTrigger>
                    <TabsTrigger value="position">Position</TabsTrigger>
                    <TabsTrigger value="styling">Styling</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  </TabsList>

                  {/* Basic Settings Tab */}
                  <TabsContent value="basic" className="space-y-6 mt-6">
                    {/* Template Selection */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-primary" />
                        Template
                      </Label>
                      <Select 
                        value={settings.template || 'custom'} 
                        onValueChange={(value) => handleSettingChange('template', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">Custom</SelectItem>
                          <SelectItem value="corporate">Corporate</SelectItem>
                          <SelectItem value="confidential">Confidential</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

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
                        placeholder="Enter watermark text (use {pageNumber} for page numbers)"
                        className="font-medium"
                      />
                      <p className="text-xs text-muted-foreground">
                        Use {'{pageNumber}'} to include page numbers in your watermark
                      </p>
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
                  </TabsContent>

                  {/* Position Settings Tab */}
                  <TabsContent value="position" className="space-y-6 mt-6">
                    {/* Position Type */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Grid3X3 className="h-4 w-4 text-primary" />
                        Position Type
                      </Label>
                      <Select 
                        value={settings.position?.type || 'center'} 
                        onValueChange={(value) => handlePositionChange('type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="center">Center (Classic)</SelectItem>
                          <SelectItem value="corner">Corner Position</SelectItem>
                          <SelectItem value="multiple">Multiple Positions</SelectItem>
                          <SelectItem value="custom">Custom Coordinates</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Corner Selection (when corner type selected) */}
                    {settings.position?.type === 'corner' && (
                      <div className="space-y-2">
                        <Label>Corner Position</Label>
                        <Select 
                          value={settings.position?.corner || 'bottom-right'} 
                          onValueChange={(value) => handlePositionChange('corner', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="top-left">Top Left</SelectItem>
                            <SelectItem value="top-right">Top Right</SelectItem>
                            <SelectItem value="bottom-left">Bottom Left</SelectItem>
                            <SelectItem value="bottom-right">Bottom Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <Separator />

                    {/* Position Offset */}
                    <div className="space-y-3">
                      <Label>Position Offset</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="offset-x" className="text-sm">X Offset</Label>
                          <Input
                            id="offset-x"
                            type="number"
                            value={settings.position?.offset?.x || 0}
                            onChange={(e) => handlePositionChange('offset', {
                              ...settings.position?.offset,
                              x: parseInt(e.target.value) || 0
                            })}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="offset-y" className="text-sm">Y Offset</Label>
                          <Input
                            id="offset-y"
                            type="number"
                            value={settings.position?.offset?.y || 0}
                            onChange={(e) => handlePositionChange('offset', {
                              ...settings.position?.offset,
                              y: parseInt(e.target.value) || 0
                            })}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Styling Settings Tab */}
                  <TabsContent value="styling" className="space-y-6 mt-6">
                    {/* Font Family */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Type className="h-4 w-4 text-primary" />
                        Font Family
                      </Label>
                      <Select 
                        value={settings.style?.fontFamily || 'helvetica'} 
                        onValueChange={(value) => handleStyleChange('fontFamily', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="helvetica">Helvetica (Modern)</SelectItem>
                          <SelectItem value="times">Times Roman (Classic)</SelectItem>
                          <SelectItem value="courier">Courier (Monospace)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Rotation Angle */}
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <RotateCw className="h-4 w-4 text-primary" />
                        Rotation: {settings.style?.rotation || -45}°
                      </Label>
                      <Slider
                        value={[settings.style?.rotation || -45]}
                        onValueChange={(value) => handleStyleChange('rotation', value[0])}
                        min={-180}
                        max={180}
                        step={15}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>-180°</span>
                        <span>0°</span>
                        <span>180°</span>
                      </div>
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
                  </TabsContent>

                  {/* Advanced Settings Tab */}
                  <TabsContent value="advanced" className="space-y-6 mt-6">
                    {/* Transparency Type */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-primary" />
                        Transparency Effect
                      </Label>
                      <Select 
                        value={settings.transparency?.type || 'uniform'} 
                        onValueChange={(value) => handleTransparencyChange('type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="uniform">Uniform</SelectItem>
                          <SelectItem value="gradient">Gradient</SelectItem>
                          <SelectItem value="fade">Fade from Center</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Page Range */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Move className="h-4 w-4 text-primary" />
                        Apply to Pages
                      </Label>
                      <Select 
                        value={settings.pageSpecific?.pageRange || 'all'} 
                        onValueChange={(value) => handlePageSpecificChange('pageRange', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Pages</SelectItem>
                          <SelectItem value="first">First Page Only</SelectItem>
                          <SelectItem value="last">Last Page Only</SelectItem>
                          <SelectItem value="odd">Odd Pages</SelectItem>
                          <SelectItem value="even">Even Pages</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Shadow Effects Toggle */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="shadow-effects" className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          Shadow Effects
                        </Label>
                        <Switch
                          id="shadow-effects"
                          checked={!!settings.style?.effects?.shadow}
                          onCheckedChange={(checked) => 
                            handleStyleChange('effects', {
                              ...settings.style?.effects,
                              shadow: checked ? { offsetX: 2, offsetY: 2, blur: 1, color: '#000000' } : undefined
                            })
                          }
                        />
                      </div>
                      {settings.style?.effects?.shadow && (
                        <div className="ml-6 space-y-2 text-sm text-muted-foreground">
                          <p>Shadow effects are enabled for professional appearance</p>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Outline Effects Toggle */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="outline-effects" className="flex items-center gap-2">
                          <Type className="h-4 w-4 text-primary" />
                          Text Outline
                        </Label>
                        <Switch
                          id="outline-effects"
                          checked={!!settings.style?.effects?.outline}
                          onCheckedChange={(checked) => 
                            handleStyleChange('effects', {
                              ...settings.style?.effects,
                              outline: checked ? { width: 1, color: '#000000' } : undefined
                            })
                          }
                        />
                      </div>
                      {settings.style?.effects?.outline && (
                        <div className="ml-6 space-y-2 text-sm text-muted-foreground">
                          <p>Text outline enhances readability on various backgrounds</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                <Separator className="my-6" />

                {/* Processing Info */}
                <div className="bg-primary-light/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {isSingleMode ? (
                      <>
                        <User className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">Document Configuration</span>
                      </>
                    ) : (
                      <>
                        <Move className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">Batch Configuration</span>
                      </>
                    )}
                  </div>
                  <CardDescription className="text-sm">
                    {isSingleMode 
                      ? 'Advanced watermarking settings will be applied to your document'
                      : `Advanced watermarking settings will be applied to all ${batchData?.files?.length || 0} documents in this batch`
                    }
                  </CardDescription>
                  {batchId && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {isSingleMode ? 'Processing' : 'Batch'} ID: {batchId.slice(0, 8)}...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button 
                variant={hasUnsavedChanges ? "default" : "outline"}
                onClick={handlePreviewUpdate}
                disabled={isPreviewLoading}
                className="flex-1"
              >
                <Eye className="mr-2 h-4 w-4" />
                {isPreviewLoading ? 'Saving...' : hasUnsavedChanges ? 'Save Settings' : 'Settings Saved'}
              </Button>
              
              <Button 
                onClick={handleNext}
                className="flex-1 bg-gradient-primary hover:scale-[1.02] transition-transform duration-200 shadow-elevated"
                size="lg"
              >
                {isSingleMode ? 'Process Document' : 'Start Processing'}
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