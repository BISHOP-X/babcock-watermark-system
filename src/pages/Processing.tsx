import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Play, Pause, X, CheckCircle2, AlertCircle, FileText, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { ProcessingItem } from "@/components/ProcessingItem";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { useToast } from "@/hooks/use-toast";

interface ProcessingFile {
  id: string;
  name: string;
  size: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

const Processing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get data from previous steps
  const uploadedFiles = location.state?.files || [];
  const watermarkSettings = location.state?.watermarkSettings || {};
  
  const [files, setFiles] = useState<ProcessingFile[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  useEffect(() => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "No files to process",
        description: "Please upload and configure files first.",
        variant: "destructive",
      });
      navigate('/upload');
      return;
    }

    // Initialize processing files
    const processingFiles: ProcessingFile[] = uploadedFiles.map((file: any, index: number) => ({
      id: file.id || `file-${index}`,
      name: file.name || `Document ${index + 1}`,
      size: file.size || 0,
      status: 'queued',
      progress: 0
    }));

    setFiles(processingFiles);
    startProcessing(processingFiles);
  }, [uploadedFiles, navigate, toast]);

  const startProcessing = async (processingFiles: ProcessingFile[]) => {
    setIsProcessing(true);
    
    for (let i = 0; i < processingFiles.length; i++) {
      if (isPaused) break;
      
      setCurrentFileIndex(i);
      
      // Update file status to processing
      setFiles(prev => prev.map((file, index) => 
        index === i ? { ...file, status: 'processing', progress: 0 } : file
      ));

      // Simulate processing with progress updates
      for (let progress = 0; progress <= 100; progress += 10) {
        if (isPaused) break;
        
        await new Promise(resolve => setTimeout(resolve, 150));
        
        setFiles(prev => prev.map((file, index) => 
          index === i ? { ...file, progress } : file
        ));
      }

      // Randomly simulate some failures for realism
      const shouldFail = Math.random() < 0.1; // 10% chance of failure
      
      setFiles(prev => prev.map((file, index) => 
        index === i ? {
          ...file,
          status: shouldFail ? 'failed' : 'completed',
          progress: 100,
          error: shouldFail ? 'Watermarking failed - file may be corrupted' : undefined
        } : file
      ));

      // Update overall progress
      const completedFiles = i + 1;
      const newOverallProgress = (completedFiles / processingFiles.length) * 100;
      setOverallProgress(newOverallProgress);
    }

    if (!isPaused) {
      setIsProcessing(false);
      
      // Check results and navigate
      setTimeout(() => {
        navigate('/results', {
          state: {
            files: files,
            watermarkSettings,
            processedFiles: files.filter(f => f.status === 'completed').length,
            failedFiles: files.filter(f => f.status === 'failed').length
          }
        });
      }, 1000);
    }
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    if (isPaused) {
      // Resume processing from current file
      const remainingFiles = files.slice(currentFileIndex);
      startProcessing(files);
    }
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const confirmCancel = () => {
    setIsProcessing(false);
    setIsPaused(false);
    toast({
      title: "Processing cancelled",
      description: "The watermarking process has been stopped.",
      variant: "destructive",
    });
    navigate('/upload');
  };

  const completedFiles = files.filter(f => f.status === 'completed').length;
  const failedFiles = files.filter(f => f.status === 'failed').length;
  const processingFile = files.find(f => f.status === 'processing');

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Processing Documents
          </h1>
          <p className="text-muted-foreground text-lg">
            Applying watermarks to your documents...
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Progress Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overall Progress */}
            <div className="animate-slide-up">
              <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Batch Progress
                    </span>
                    <Badge variant={isProcessing ? "default" : "secondary"}>
                      {isProcessing ? (isPaused ? 'Paused' : 'Processing') : 'Completed'}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Processing {completedFiles} of {files.length} documents
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Progress</span>
                      <span>{Math.round(overallProgress)}%</span>
                    </div>
                    <Progress value={overallProgress} className="h-3" />
                  </div>
                  
                  {processingFile && (
                    <div className="p-4 bg-primary-light/20 rounded-lg border border-primary-light">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                        <span className="font-medium">Currently processing:</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {processingFile.name}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={handlePauseResume}
                      disabled={!isProcessing && !isPaused}
                      className="flex-1"
                    >
                      {isPaused ? (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Resume
                        </>
                      ) : (
                        <>
                          <Pause className="mr-2 h-4 w-4" />
                          Pause
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="destructive"
                      onClick={handleCancel}
                      disabled={!isProcessing && !isPaused}
                      className="flex-1"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel Batch
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Individual File Progress */}
            <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
              <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Document Status</CardTitle>
                  <CardDescription>
                    Individual file processing status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {files.map((file, index) => (
                      <ProcessingItem
                        key={file.id}
                        file={file}
                        index={index}
                        animationDelay={index * 50}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Status Summary */}
          <div className="animate-scale-in" style={{ animationDelay: "300ms" }}>
            <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Processing Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Files:</span>
                    <span className="font-medium">{files.length}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Completed:</span>
                    <span className="font-medium text-green-600">{completedFiles}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Failed:</span>
                    <span className="font-medium text-red-600">{failedFiles}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Remaining:</span>
                    <span className="font-medium">{files.length - completedFiles - failedFiles}</span>
                  </div>
                </div>

                {overallProgress === 100 && (
                  <Button 
                    className="w-full bg-gradient-primary hover:scale-[1.02] transition-transform duration-200 shadow-elevated"
                    onClick={() => navigate('/results', {
                      state: {
                        files,
                        watermarkSettings,
                        processedFiles: completedFiles,
                        failedFiles
                      }
                    })}
                    size="lg"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    View Results
                  </Button>
                )}

                {/* Watermark Settings Summary */}
                <div className="pt-4 border-t space-y-2">
                  <h4 className="font-medium text-sm">Watermark Settings:</h4>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div>Text: "{watermarkSettings.text}"</div>
                    <div>Opacity: {watermarkSettings.opacity}%</div>
                    <div>Size: {watermarkSettings.fontSize}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={confirmCancel}
        title="Cancel Processing?"
        description="Are you sure you want to cancel the watermarking process? All progress will be lost."
        confirmText="Cancel Process"
        cancelText="Continue Processing"
        variant="destructive"
      />
    </div>
  );
};

export default Processing;