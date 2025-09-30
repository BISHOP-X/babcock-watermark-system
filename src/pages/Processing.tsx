import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Play, Pause, X, CheckCircle2, AlertCircle, FileText, Download, User, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { ProcessingItem } from "@/components/ProcessingItem";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { useToast } from "@/hooks/use-toast";
import { fileProcessor } from "@/lib/fileProcessor";
import { apiService, FileData } from "@/lib/api";

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
  const { batchId } = useParams<{ batchId: string }>();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Check if this is single file mode
  const isSingleMode = searchParams.get('mode') === 'single';
  
  // State for batch data loaded from API
  const [batchData, setBatchData] = useState<any>(null);
  const [watermarkSettings, setWatermarkSettings] = useState<any>({});
  
  const [files, setFiles] = useState<ProcessingFile[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [batchStatus, setBatchStatus] = useState<string>('pending');
  
  // Use ref to track processing state across async operations
  const processingStateRef = useRef({ isPaused: false, shouldStop: false });

  useEffect(() => {
    if (!batchId) {
      toast({
        title: "Invalid batch ID",
        description: "Please upload and configure files first.",
        variant: "destructive",
      });
      navigate('/upload');
      return;
    }

    loadBatchDataAndInitialize();
  }, [batchId, navigate, toast]);

  const loadBatchDataAndInitialize = async () => {
    try {
      // Load batch data from API
      const batch = await apiService.getBatch(batchId);
      setBatchData(batch);
      setWatermarkSettings(batch.watermarkSettings || {});
      
      // Initialize processing with loaded data
      await initializeBatchProcessing();
    } catch (error) {
      console.error('Failed to load batch data:', error);
      toast({
        title: "Failed to load batch",
        description: "Could not load batch information. Please try again.",
        variant: "destructive",
      });
      navigate('/upload');
    }
  };

  const initializeBatchProcessing = async () => {
    try {
      // Load batch files from database
      const batchFiles = await apiService.getBatchFiles(batchId);
      
      // Initialize processing state
      const processingFiles: ProcessingFile[] = batchFiles.map((file: FileData) => ({
        id: file.id,
        name: file.originalName,
        size: file.fileSize,
        status: file.status as 'queued' | 'processing' | 'completed' | 'failed',
        progress: file.progress,
        error: file.errorMessage
      }));

      setFiles(processingFiles);
      
      // Auto-start processing if batch is pending
      const batch = await apiService.getBatch(batchId);
      setBatchStatus(batch.status);
      
      if (batch.status === 'pending') {
        startRealProcessing();
      } else if (batch.status === 'processing') {
        // Resume processing monitoring
        monitorProcessingProgress();
      }
      
    } catch (error) {
      console.error('Failed to initialize batch processing:', error);
      toast({
        title: "Initialization failed",
        description: "Failed to load batch data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const startRealProcessing = async () => {
    if (!batchId) return;
    
    setIsProcessing(true);
    processingStateRef.current = { isPaused: false, shouldStop: false };
    
    try {
      // Start batch processing in background
      const processingPromise = fileProcessor.processBatch(batchId);
      
      // Monitor progress while processing
      const progressMonitor = monitorProcessingProgress();
      
      // Wait for processing to complete
      await processingPromise;
      
      // Stop progress monitoring
      clearInterval(progressMonitor);
      
      // Final status check
      await updateBatchStatus();
      
      toast({
        title: "Processing completed!",
        description: isSingleMode 
          ? "Your document has been processed. Redirecting to download..." 
          : "All files have been processed. Redirecting to results...",
      });
      
      // Navigate to results after a brief delay
      setTimeout(() => {
        navigate(`/results/${batchId}${isSingleMode ? '?mode=single' : ''}`);
      }, 2000);
      
    } catch (error) {
      console.error('Batch processing failed:', error);
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "An error occurred during processing.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const monitorProcessingProgress = () => {
    const intervalId = setInterval(async () => {
      if (processingStateRef.current.shouldStop) {
        clearInterval(intervalId);
        return;
      }
      
      try {
        // Get updated batch and file status
        const [batch, batchFiles] = await Promise.all([
          apiService.getBatch(batchId),
          apiService.getBatchFiles(batchId)
        ]);
        
        setBatchStatus(batch.status);
        
        // Update file states
        const updatedFiles: ProcessingFile[] = batchFiles.map((file: FileData) => ({
          id: file.id,
          name: file.originalName,
          size: file.fileSize,
          status: file.status as 'queued' | 'processing' | 'completed' | 'failed',
          progress: file.progress,
          error: file.errorMessage
        }));
        
        setFiles(updatedFiles);
        
        // Calculate overall progress
        const totalFiles = updatedFiles.length;
        const completedFiles = updatedFiles.filter(f => f.status === 'completed' || f.status === 'failed').length;
        const newProgress = totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0;
        setOverallProgress(newProgress);
        
        // Stop monitoring if batch is complete
        if (batch.status === 'completed' || batch.status === 'failed') {
          clearInterval(intervalId);
          setIsProcessing(false);
        }
        
      } catch (error) {
        console.error('Failed to update progress:', error);
      }
    }, 1000); // Update every second
    
    return intervalId;
  };

  const updateBatchStatus = async () => {
    try {
      const batch = await apiService.getBatch(batchId);
      setBatchStatus(batch.status);
    } catch (error) {
      console.error('Failed to update batch status:', error);
    }
  };

  const handlePauseResume = () => {
    // Note: Real batch processing is handled by the backend
    // This UI feedback shows the current state but doesn't actually pause the backend
    toast({
      title: "Backend Processing",
      description: "Processing is handled by the backend and cannot be paused from the UI.",
      variant: "default",
    });
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    try {
      processingStateRef.current.shouldStop = true;
      
      // Update batch status to failed (cancelled)
      await apiService.updateBatchStatus(batchId, 'failed');
      
      setIsProcessing(false);
      setIsPaused(false);
      
      toast({
        title: "Processing cancelled",
        description: "The watermarking process has been stopped.",
        variant: "destructive",
      });
      
      navigate('/upload');
    } catch (error) {
      console.error('Failed to cancel batch:', error);
      toast({
        title: "Cancel failed",
        description: "Failed to cancel processing. Please try again.",
        variant: "destructive",
      });
    }
  };

  const completedFiles = files.filter(f => f.status === 'completed').length;
  const failedFiles = files.filter(f => f.status === 'failed').length;
  const processingFile = files.find(f => f.status === 'processing');
  const isCompleted = batchStatus === 'completed' || batchStatus === 'failed';
  const canNavigateToResults = isCompleted && overallProgress >= 100;

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
                      {isSingleMode ? (
                        <>
                          <User className="h-5 w-5 text-primary" />
                          Document Progress
                        </>
                      ) : (
                        <>
                          <FileText className="h-5 w-5 text-primary" />
                          Batch Progress
                        </>
                      )}
                    </span>
                    <Badge variant={isProcessing ? "default" : isCompleted ? "secondary" : "outline"}>
                      {isProcessing ? 'Processing' : batchStatus === 'completed' ? 'Completed' : batchStatus === 'failed' ? 'Failed' : 'Ready'}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {isSingleMode 
                      ? `Processing your document with watermarks`
                      : `Processing ${completedFiles} of ${files.length} documents`
                    }
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
                      disabled={!isProcessing}
                      className="flex-1"
                    >
                      <Pause className="mr-2 h-4 w-4" />
                      Processing...
                    </Button>
                    
                    <Button
                      variant="destructive"
                      onClick={handleCancel}
                      disabled={isCompleted}
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

                {canNavigateToResults && (
                  <Button 
                    className="w-full bg-gradient-primary hover:scale-[1.02] transition-transform duration-200 shadow-elevated"
                    onClick={() => navigate(`/results/${batchId}${isSingleMode ? '?mode=single' : ''}`)}
                    size="lg"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {isSingleMode ? 'Download File' : 'View Results'}
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