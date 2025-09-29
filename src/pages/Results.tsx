import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Download, CheckCircle2, AlertTriangle, FileText, ArrowLeft, Eye, Package, RotateCcw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

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
  const location = useLocation();
  const { toast } = useToast();
  
  // Get data from processing
  const files = location.state?.files || [];
  const watermarkSettings = location.state?.watermarkSettings || {};
  const processedFiles = location.state?.processedFiles || 0;
  const failedFiles = location.state?.failedFiles || 0;
  
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  useEffect(() => {
    if (files.length === 0) {
      toast({
        title: "No results found",
        description: "Please complete the watermarking process first.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    // Show success notification
    if (processedFiles > 0) {
      toast({
        title: "Processing completed!",
        description: `${processedFiles} documents have been successfully watermarked.`,
      });
    }
  }, [files.length, processedFiles, navigate, toast]);

  const handleDownloadAll = async () => {
    setIsDownloading(true);
    
    try {
      // Simulate ZIP download
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a mock download
      const element = document.createElement('a');
      element.href = '#'; // In real app, this would be the ZIP file URL
      element.download = `CPGS_Watermarked_Documents_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      toast({
        title: "Download started",
        description: "Your watermarked documents are being downloaded as a ZIP file.",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "There was an error downloading the files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadFile = async (file: ProcessedFile) => {
    setDownloadingFile(file.id);
    
    try {
      // Simulate individual file download
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const element = document.createElement('a');
      element.href = '#'; // In real app, this would be the file URL
      element.download = `Watermarked_${file.name}`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      toast({
        title: "File downloaded",
        description: `${file.name} has been downloaded successfully.`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: `Failed to download ${file.name}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setDownloadingFile(null);
    }
  };

  const handlePreviewFile = (file: ProcessedFile) => {
    toast({
      title: "Preview opening",
      description: `Opening preview for ${file.name}...`,
    });
    // In real app, this would open a preview modal or new tab
  };

  const completedFilesList = files.filter((f: ProcessedFile) => f.status === 'completed');
  const failedFilesList = files.filter((f: ProcessedFile) => f.status === 'failed');

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
              onClick={() => navigate('/processing')}
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
              Processing Complete!
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Your documents have been processed with CPGS watermarks and are ready for download.
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
                  {failedFiles}
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
            {/* Bulk Download */}
            {processedFiles > 0 && (
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
            {completedFilesList.length > 0 && (
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
                      {completedFilesList.map((file: ProcessedFile, index: number) => (
                        <div 
                          key={file.id}
                          className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between animate-fade-in"
                          style={{ animationDelay: `${(index + 1) * 100}ms` }}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileText className="h-5 w-5 text-green-600 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.size)}
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
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadFile(file)}
                              disabled={downloadingFile === file.id}
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
            {failedFilesList.length > 0 && (
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
                      {failedFilesList.map((file: ProcessedFile, index: number) => (
                        <div 
                          key={file.id}
                          className="p-4 bg-red-50 border border-red-200 rounded-lg animate-fade-in"
                          style={{ animationDelay: `${(index + 1) * 100}ms` }}
                        >
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{file.name}</p>
                              <p className="text-xs text-red-600 mt-1">
                                {file.error || 'Unknown error occurred'}
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
                  Process New Batch
                </Button>
                
                <Separator />
                
                {/* Watermark Summary */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Applied Watermark:</h4>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="p-2 bg-muted rounded">
                      <div className="font-medium">"{watermarkSettings.text || 'College of Postgraduate School, BU'}"</div>
                      <div className="mt-1">
                        Opacity: {watermarkSettings.opacity || 30}% • 
                        Size: {watermarkSettings.fontSize || 'medium'} • 
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
                    <li>• Documents are ready for external review</li>
                    <li>• Watermarks are permanent and cannot be removed</li>
                    <li>• Keep original files for internal use</li>
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