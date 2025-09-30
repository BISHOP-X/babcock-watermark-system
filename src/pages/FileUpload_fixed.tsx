import { useState, useCallback } from "react";
import { Upload, FileText, X, AlertCircle, CheckCircle2, Database, Settings, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { FileDropzone } from "@/components/FileDropzone";
import { FileList } from "@/components/FileList";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";
import { testStorageAccess } from "@/lib/storageTest";
import { v4 as uuidv4 } from 'uuid';

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'valid' | 'invalid';
}

const FileUpload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isStorageTesting, setIsStorageTesting] = useState(false);
  const [storageTestResult, setStorageTestResult] = useState<{ 
    success: boolean; 
    message: string; 
    error?: string 
  } | null>(null);

  const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
  const maxFileSize = 50 * 1024 * 1024; // 50MB

  const validateFile = (file: File): boolean => {
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: `${file.name} is not a supported format. Please upload PDF or Word documents only.`,
        variant: "destructive",
      });
      return false;
    }

    if (file.size > maxFileSize) {
      toast({
        title: "File too large",
        description: `${file.name} exceeds the 50MB limit.`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleStorageTest = async () => {
    setIsStorageTesting(true);
    setStorageTestResult(null);
    
    toast({
      title: "Testing storage access...",
      description: "Checking Supabase storage permissions",
    });
    
    try {
      const result = await testStorageAccess();
      
      // Normalize the result to match our interface
      const normalizedResult = {
        success: result.success,
        message: result.message || (result.success ? "Storage test passed" : "Storage test failed"),
        error: result.error
      };
      
      setStorageTestResult(normalizedResult);
      
      if (normalizedResult.success) {
        toast({
          title: "✅ Storage test passed!",
          description: result.message || "File uploads should work now",
        });
      } else {
        toast({
          title: "❌ Storage test failed",
          description: result.error || "Check console for details",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      setStorageTestResult({
        success: false,
        message: "Storage test failed",
        error: errorMessage
      });
      
      toast({
        title: "❌ Storage test error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsStorageTesting(false);
    }
  };

  const handleFilesSelected = useCallback((selectedFiles: FileList) => {
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = [];

    Array.from(selectedFiles).forEach((file: File) => {
      if (validateFile(file)) {
        newFiles.push({
          id: `${Date.now()}-${Math.random()}`,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'valid'
        });
      }
    });

    setFiles(prev => [...prev, ...newFiles]);

    if (newFiles.length > 0) {
      toast({
        title: `Added ${newFiles.length} file(s)`,
        description: "Files are ready for upload",
      });
    }
  }, [toast]);

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    toast({
      title: "File removed",
      description: "File has been removed from the upload queue",
    });
  };

  const clearAllFiles = () => {
    setFiles([]);
    toast({
      title: "All files cleared",
      description: "Upload queue has been cleared",
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to upload first",
        variant: "destructive",
      });
      return;
    }

    const validFiles = files.filter(f => f.status === 'valid');
    if (validFiles.length === 0) {
      toast({
        title: "No valid files",
        description: "Please select valid PDF or Word documents",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      console.log('🚀 Starting upload process...');
      
      // Use default watermark settings
      const watermarkSettings = {
        text: 'CPGS - Babcock University',
        position: 'center' as const,
        opacity: 0.3,
        fontSize: 'medium' as const,
        color: '#000000'
      };

      console.log('📦 Creating batch...');
      const batchId = await apiService.createBatch(
        validFiles.map(f => f.file),
        watermarkSettings
      );

      console.log('📁 Batch created:', batchId);

      // Upload files to storage and add to database
      const uploadPromises = validFiles.map(async (fileData) => {
        try {
          // Generate unique file path
          const filePath = `${batchId}/${uuidv4()}_${fileData.file.name}`;
          
          console.log(`📤 Uploading ${fileData.file.name}...`);
          
          // Upload file to storage
          const storagePath = await apiService.uploadFile(fileData.file, filePath);
          
          console.log(`✅ Uploaded ${fileData.file.name} to ${storagePath}`);
          
          return {
            ...fileData,
            storagePath
          };
        } catch (error) {
          console.error(`❌ Failed to upload ${fileData.file.name}:`, error);
          throw error;
        }
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      console.log('✅ All files uploaded successfully');

      // Add files to batch in database
      await apiService.addFilesToBatch(
        batchId,
        uploadedFiles.map(f => f.file) // Pass the original File objects
      );

      console.log('✅ Files added to batch in database');

      toast({
        title: "Upload successful!",
        description: `${validFiles.length} file(s) uploaded successfully`,
      });

      // Navigate to watermark configuration
      navigate(`/watermark-config/${batchId}`);

    } catch (error) {
      console.error('Upload error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Upload failed",
        description: `Failed to upload files: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const canUpload = files.length > 0 && files.some(f => f.status === 'valid') && !isUploading;

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Upload Documents
          </h1>
          <p className="text-muted-foreground text-lg">
            Select PDF or Word documents to apply watermarks
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* File Upload Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dropzone */}
            <div className="animate-scale-in">
              <FileDropzone onFilesSelected={handleFilesSelected} />
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="animate-slide-up">
                <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle>Selected Files ({files.length})</CardTitle>
                      <CardDescription>
                        {files.filter(f => f.status === 'valid').length} valid file(s) ready for upload
                      </CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearAllFiles}
                      disabled={isUploading}
                    >
                      Clear All
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <FileList files={files} onRemove={removeFile} />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Upload Button */}
            {files.length > 0 && (
              <div className="flex justify-center animate-bounce-in">
                <Button
                  onClick={handleUpload}
                  disabled={!canUpload}
                  size="lg"
                  className="bg-gradient-primary hover:scale-[1.02] transition-transform duration-200 shadow-elevated px-8"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Start Watermarking
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Storage Test Card */}
            <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Storage Test
                </CardTitle>
                <CardDescription>
                  Test backend storage connectivity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={handleStorageTest}
                  disabled={isStorageTesting}
                >
                  <Database className="mr-2 h-4 w-4" />
                  {isStorageTesting ? 'Testing...' : 'Test Storage Access'}
                </Button>
                
                {storageTestResult && (
                  <Alert variant={storageTestResult.success ? "default" : "destructive"}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {storageTestResult.success ? (
                        <span className="text-green-700">
                          ✅ {storageTestResult.message}
                        </span>
                      ) : (
                        <div>
                          <div className="font-medium">❌ {storageTestResult.message}</div>
                          {storageTestResult.error && (
                            <div className="text-sm mt-1 opacity-90">
                              {storageTestResult.error}
                            </div>
                          )}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Guidelines */}
            <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Upload Guidelines
                </CardTitle>
                <CardDescription>
                  Best practices for document processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Use high-quality PDF or DOCX files</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Ensure files are not password protected</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Maximum file size: 50MB per document</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Batch upload up to 20 files at once</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-3">Supported formats:</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-primary-light text-primary-dark text-xs rounded-md font-medium">
                      PDF
                    </span>
                    <span className="px-2 py-1 bg-primary-light text-primary-dark text-xs rounded-md font-medium">
                      DOCX
                    </span>
                    <span className="px-2 py-1 bg-primary-light text-primary-dark text-xs rounded-md font-medium">
                      DOC
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FileUpload;