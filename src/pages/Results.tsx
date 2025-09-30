import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Download, CheckCircle2, AlertTriangle, FileText, ArrowLeft, Eye, Package, RotateCcw, RefreshCw, User, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { apiService, FileData, BatchData } from "@/lib/api";
import { zipService } from "@/lib/zipService";

interface ProcessedFile {
  id: string;
  name: string;
  size: number;
  status: 'completed' | 'failed';
  error?: string;
  downloadUrl?: string;
}

const Results = () => {
  const navigate = useNavigate();
  const { batchId } = useParams<{ batchId: string }>();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Check if this is single file mode
  const isSingleMode = searchParams.get('mode') === 'single';
  
  // State for batch data loaded from API
  const [batch, setBatch] = useState<BatchData | null>(null);
  const [files, setFiles] = useState<FileData[]>([]);
  const [watermarkSettings, setWatermarkSettings] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!batchId) {
      toast({
        title: "No batch found",
        description: "Please complete the watermarking process first.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    loadBatchResults();
  }, [batchId, navigate, toast]);

  const loadBatchResults = async () => {
    try {
      setIsLoading(true);
      
      // Load batch and files data
      const [batchData, batchFiles] = await Promise.all([
        apiService.getBatch(batchId),
        apiService.getBatchFiles(batchId)
      ]);
      
      setBatch(batchData);
      setFiles(batchFiles);
      setWatermarkSettings(batchData.watermarkSettings || {});
      
      // Show success notification for completed batches
      const completedFiles = batchFiles.filter(f => f.status === 'completed').length;
      if (completedFiles > 0 && batchData.status === 'completed') {
        toast({
          title: "Processing completed!",
          description: `${completedFiles} documents have been successfully watermarked.`,
        });
      }
      
    } catch (error) {
      console.error('Failed to load batch results:', error);
      toast({
        title: "Failed to load results",
        description: "There was an error loading the batch results. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadAll = async () => {
    if (!batch || files.length === 0) return;
    
    setIsDownloading(true);
    
    try {
      const completedFiles = files.filter(f => f.status === 'completed' && f.watermarkedFilePath);
      
      if (completedFiles.length === 0) {
        toast({
          title: "No files to download",
          description: "There are no successfully processed files to download.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Creating ZIP file...",
        description: `Preparing ${completedFiles.length} files for download.`,
      });
      
      // Create ZIP file with all completed files
      const zipBlob = await zipService.createBatchZip(completedFiles, batch.batchName);
      
      // Download the ZIP file
      const fileName = `${batch.batchName || 'CPGS_Watermarked_Documents'}_${new Date().toISOString().split('T')[0]}`;
      zipService.downloadZip(zipBlob, fileName);
      
      toast({
        title: "Download started",
        description: `ZIP file with ${completedFiles.length} watermarked documents is downloading.`,
      });
      
    } catch (error) {
      console.error('ZIP download failed:', error);
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to create ZIP file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadFile = async (file: FileData) => {
    setDownloadingFile(file.id);
    
    try {
      await zipService.downloadIndividualFile(file);
      
      toast({
        title: "File downloaded",
        description: `${file.originalName} has been downloaded successfully.`,
      });
    } catch (error) {
      console.error('File download failed:', error);
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : `Failed to download ${file.originalName}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setDownloadingFile(null);
    }
  };

  const handlePreviewFile = async (file: FileData) => {
    try {
      const url = await zipService.getFilePreviewUrl(file);
      setPreviewUrl(url);
      
      // Open in new tab for now (could be enhanced with modal)
      window.open(url, '_blank');
      
      toast({
        title: "Preview opened",
        description: `Opening preview for ${file.originalName}...`,
      });
      
      // Clean up URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60000); // Clean up after 1 minute
      
    } catch (error) {
      console.error('Preview failed:', error);
      toast({
        title: "Preview failed",
        description: error instanceof Error ? error.message : `Failed to preview ${file.originalName}.`,
        variant: "destructive",
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading batch results...</p>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="text-muted-foreground">Failed to load batch data</p>
          <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  const completedFiles = files.filter(f => f.status === 'completed');
  const failedFiles = files.filter(f => f.status === 'failed');
  const processedFiles = completedFiles.length;
  const failedCount = failedFiles.length;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/processing/${batchId}${isSingleMode ? '?mode=single' : ''}`)}
              className="hover:bg-primary-light"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Processing
            </Button>
          </div>
          
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-green-100 rounded-full">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {isSingleMode ? 'Document Ready!' : 'Processing Complete!'}
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {isSingleMode 
                ? 'Your document has been processed with CPGS watermarks and is ready for download.'
                : 'Your documents have been processed with CPGS watermarks and are ready for download.'
              }
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="animate-slide-up">
            <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm text-center">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {processedFiles}
                </div>
                <p className="text-sm text-muted-foreground">
                  Successfully Processed
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="animate-slide-up" style={{ animationDelay: "100ms" }}>
            <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm text-center">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
                <div className="text-2xl font-bold text-red-600 mb-1">
                  {failedCount}
                </div>
                <p className="text-sm text-muted-foreground">
                  Failed to Process
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
            <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm text-center">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <Package className="h-8 w-8 text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary mb-1">
                  {files.length}
                </div>
                <p className="text-sm text-muted-foreground">
                  Total Documents
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Download Options */}
          <div className="lg:col-span-2 space-y-6">
            {/* Single File Download (for single mode) */}
            {isSingleMode && completedFiles.length > 0 && (
              <div className="animate-slide-up" style={{ animationDelay: "300ms" }}>
                <Card className="shadow-card border-0 bg-gradient-to-r from-primary/5 to-primary/10 backdrop-blur-sm border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Download Your Document
                    </CardTitle>
                    <CardDescription>
                      Your watermarked document is ready for download
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {completedFiles.map((file: FileData) => (
                      <div key={file.id} className="p-4 bg-white/80 border border-primary/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileText className="h-6 w-6 text-primary flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-base truncate">
                                {file.originalName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatFileSize(file.fileSize)} • Watermarked PDF
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-3 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreviewFile(file)}
                              disabled={!file.watermarkedFilePath}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Button>
                            <Button
                              onClick={() => handleDownloadFile(file)}
                              disabled={downloadingFile === file.id || !file.watermarkedFilePath}
                              className="bg-gradient-primary hover:scale-[1.02] transition-transform duration-200 shadow-elevated"
                              size="lg"
                            >
                              {downloadingFile === file.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                                  Downloading...
                                </>
                              ) : (
                                <>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download PDF
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Bulk Download (for batch mode) */}
            {!isSingleMode && processedFiles > 0 && (
              <div className="animate-slide-up" style={{ animationDelay: "300ms" }}>
                <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      Download All Files
                    </CardTitle>
                    <CardDescription>
                      Download all successfully processed documents as a ZIP file
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={handleDownloadAll}
                      disabled={isDownloading}
                      className="w-full md:w-auto bg-gradient-primary hover:scale-[1.02] transition-transform duration-200 shadow-elevated"
                      size="lg"
                    >
                      {isDownloading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                          Creating ZIP...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Download All ({processedFiles} files)
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Individual Files */}
            {completedFiles.length > 0 && (
              <div className="animate-slide-up" style={{ animationDelay: "400ms" }}>
                <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Successfully Processed Files</CardTitle>
                    <CardDescription>
                      Individual download and preview options
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {completedFiles.map((file: FileData, index: number) => (
                        <div 
                          key={file.id}
                          className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between animate-fade-in"
                          style={{ animationDelay: `${(index + 1) * 100}ms` }}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileText className="h-5 w-5 text-green-600 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">
                                {file.originalName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.fileSize)} • Processed {file.processedAt ? new Date(file.processedAt).toLocaleDateString() : 'Recently'}
                              </p>
                            </div>
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              Watermarked
                            </Badge>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreviewFile(file)}
                              disabled={!file.watermarkedFilePath}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadFile(file)}
                              disabled={downloadingFile === file.id || !file.watermarkedFilePath}
                            >
                              {downloadingFile === file.id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent" />
                              ) : (
                                <Download className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Failed Files */}
            {failedFiles.length > 0 && (
              <div className="animate-slide-up" style={{ animationDelay: "500ms" }}>
                <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-red-600">Failed Files</CardTitle>
                    <CardDescription>
                      Files that could not be processed
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {failedFiles.map((file: FileData, index: number) => (
                        <div 
                          key={file.id}
                          className="p-4 bg-red-50 border border-red-200 rounded-lg animate-fade-in"
                          style={{ animationDelay: `${(index + 1) * 100}ms` }}
                        >
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{file.originalName}</p>
                              <p className="text-xs text-red-600 mt-1">
                                {file.errorMessage || 'Unknown error occurred during processing'}
                              </p>
                            </div>
                            <Badge variant="destructive">
                              Failed
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Actions & Summary */}
          <div className="animate-scale-in" style={{ animationDelay: "600ms" }}>
            <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm sticky top-8">
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => navigate('/')}
                  className="w-full"
                  variant="outline"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {isSingleMode ? 'Process Another Document' : 'Process New Batch'}
                </Button>
                
                <Button 
                  onClick={loadBatchResults}
                  className="w-full"
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Results
                </Button>
                
                <Separator />
                
                {/* Processing Info */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">{isSingleMode ? 'Processing Information:' : 'Batch Information:'}</h4>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="p-2 bg-muted rounded">
                      <div className="font-medium">{isSingleMode ? 'Single Document Processing' : (batch.batchName || 'Unnamed Batch')}</div>
                      <div className="mt-1">
                        Created: {new Date(batch.createdAt).toLocaleDateString()}
                      </div>
                      {batch.completedAt && (
                        <div>
                          Completed: {new Date(batch.completedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Watermark Summary */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Applied Watermark:</h4>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="p-2 bg-muted rounded">
                      <div className="font-medium">"{watermarkSettings?.text || 'College of Postgraduate School, BU'}"</div>
                      <div className="mt-1">
                        Opacity: {watermarkSettings?.opacity || 30}% • 
                        Size: {watermarkSettings?.fontSize || 'medium'} • 
                        Diagonal placement
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Tips */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Tips:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• {isSingleMode ? 'Document is' : 'Documents are'} ready for external review</li>
                    <li>• Watermarks are permanent and cannot be removed</li>
                    <li>• Keep original {isSingleMode ? 'file' : 'files'} for internal use</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Results;