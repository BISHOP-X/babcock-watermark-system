import { useState, useCallback } from "react";
import { Upload, FileText, X, AlertCircle, CheckCircle2, Database, Settings, ArrowRight, Users, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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

type UploadMode = 'single' | 'batch';

const FileUpload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploadMode, setUploadMode] = useState<UploadMode>('single');
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

    // Handle upload mode restrictions
    if (uploadMode === 'single') {
      if (newFiles.length > 1) {
        toast({
          title: "Single file mode",
          description: "Only one file can be uploaded in single file mode. First file was selected.",
          variant: "default",
        });
        setFiles([newFiles[0]]);
      } else {
        setFiles(newFiles);
      }
    } else {
      setFiles(prev => [...prev, ...newFiles]);
    }

    if (newFiles.length > 0) {
      const selectedCount = uploadMode === 'single' && newFiles.length > 1 ? 1 : newFiles.length;
      toast({
        title: `Added ${selectedCount} file(s)`,
        description: uploadMode === 'single' ? "Ready for single file processing" : "Files are ready for batch upload",
      });
    }
  }, [toast, uploadMode]);

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

    // Validate upload mode constraints
    if (uploadMode === 'single' && validFiles.length > 1) {
      toast({
        title: "Single file mode",
        description: "Please select only one file for single file processing",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      console.log(`🚀 Starting ${uploadMode} upload process...`);
      
      // Use default watermark settings (will be configured in next step)
      const watermarkSettings = {
        text: 'CPGS - Babcock University',
        position: 'center' as const,
        opacity: 0.3,
        fontSize: 'medium' as const,
        color: '#000000'
      };

      if (uploadMode === 'single') {
        // Single file workflow - upload then configure watermarks
        const file = validFiles[0];
        
        console.log('📄 Processing single file:', file.name);
        
        // Create a minimal batch for the single file
        const batchId = await apiService.createBatch([file.file], watermarkSettings);
        
        // Generate unique file path
        const filePath = `${batchId}/${uuidv4()}_${file.file.name}`;
        
        console.log(`📤 Uploading ${file.file.name}...`);
        
        // Upload file to storage
        const storagePath = await apiService.uploadFile(file.file, filePath);
        
        console.log(`✅ Uploaded ${file.file.name} to ${storagePath}`);
        
        // Add file to batch in database
        const fileRecords = await apiService.addFilesToBatch(batchId, [file.file]);
        
        // Update file record with storage path
        if (fileRecords[0]) {
          await apiService.updateFileStoragePath(fileRecords[0].id, storagePath);
        }
        
        toast({
          title: "File uploaded successfully!",
          description: `${file.name} is ready for watermark configuration`,
        });

        // Navigate to watermark configuration for single files too
        navigate(`/watermark-config/${batchId}?mode=single`);
        
      } else {
        // Batch workflow - existing logic
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
        const fileRecords = await apiService.addFilesToBatch(
          batchId,
          uploadedFiles.map(f => f.file) // Pass the original File objects
        );

        console.log('✅ Files added to batch in database');

        // Update file records with storage paths
        const updatePromises = uploadedFiles.map(async (uploadedFile, index) => {
          const fileRecord = fileRecords[index];
          if (fileRecord) {
            await apiService.updateFileStoragePath(fileRecord.id, uploadedFile.storagePath);
          }
        });

        await Promise.all(updatePromises);
        console.log('✅ File records updated with storage paths');

        toast({
          title: "Upload successful!",
          description: `${validFiles.length} file(s) uploaded successfully`,
        });

        // Navigate to watermark configuration for batch
        navigate(`/watermark-config/${batchId}`);
      }

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

        {/* Upload Mode Toggle */}
        <div className="mb-6 animate-slide-up">
          <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Upload Mode
              </CardTitle>
              <CardDescription>
                Choose how you want to process your documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant={uploadMode === 'single' ? 'default' : 'outline'}
                  className={`h-auto p-4 flex-col items-start space-y-2 ${
                    uploadMode === 'single' 
                      ? 'bg-gradient-primary text-white shadow-elevated' 
                      : 'hover:bg-primary-light'
                  }`}
                  onClick={() => {
                    setUploadMode('single');
                    setFiles(prev => prev.slice(0, 1)); // Keep only first file
                    toast({
                      title: "Single file mode",
                      description: "Upload and process one document at a time with direct download",
                    });
                  }}
                  disabled={isUploading}
                >
                  <div className="flex items-center gap-2 w-full">
                    <User className="h-5 w-5" />
                    <span className="font-semibold">Single File</span>
                    {uploadMode === 'single' && (
                      <Badge variant="secondary" className="ml-auto">
                        Active
                      </Badge>
                    )}
                  </div>
                  <div className="text-left text-sm opacity-90">
                    <p className="mb-1">• Upload one document</p>
                    <p className="mb-1">• Configure watermarks</p>
                    <p>• Direct download (no ZIP)</p>
                  </div>
                </Button>

                <Button
                  variant={uploadMode === 'batch' ? 'default' : 'outline'}
                  className={`h-auto p-4 flex-col items-start space-y-2 ${
                    uploadMode === 'batch' 
                      ? 'bg-gradient-primary text-white shadow-elevated' 
                      : 'hover:bg-primary-light'
                  }`}
                  onClick={() => {
                    setUploadMode('batch');
                    toast({
                      title: "Batch mode",
                      description: "Upload multiple documents for bulk processing with ZIP download",
                    });
                  }}
                  disabled={isUploading}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Users className="h-5 w-5" />
                    <span className="font-semibold">Batch Upload</span>
                    {uploadMode === 'batch' && (
                      <Badge variant="secondary" className="ml-auto">
                        Active
                      </Badge>
                    )}
                  </div>
                  <div className="text-left text-sm opacity-90">
                    <p className="mb-1">• Upload multiple documents</p>
                    <p className="mb-1">• Bulk processing</p>
                    <p>• ZIP download</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
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
                      <CardTitle className="flex items-center gap-2">
                        {uploadMode === 'single' ? (
                          <>
                            <User className="h-4 w-4 text-primary" />
                            Selected File
                          </>
                        ) : (
                          <>
                            <Users className="h-4 w-4 text-primary" />
                            Selected Files ({files.length})
                          </>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {uploadMode === 'single' 
                          ? `1 file ready for direct processing` 
                          : `${files.filter(f => f.status === 'valid').length} valid file(s) ready for batch upload`
                        }
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
                      {uploadMode === 'single' ? 'Processing...' : 'Uploading...'}
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {uploadMode === 'single' 
                        ? 'Upload & Configure' 
                        : 'Upload & Configure Batch'
                      }
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
                  {uploadMode === 'single' ? 'Single File' : 'Batch Upload'} Guidelines
                </CardTitle>
                <CardDescription>
                  Best practices for {uploadMode === 'single' ? 'single document' : 'bulk document'} processing
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
                  {uploadMode === 'single' ? (
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Get instant direct download - no ZIP files</span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Batch upload up to 20 files at once</span>
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-3">
                    {uploadMode === 'single' ? 'Single file benefits:' : 'Supported formats:'}
                  </p>
                  {uploadMode === 'single' ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-primary rounded-full"></span>
                        <span>Customize watermarks</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-primary rounded-full"></span>
                        <span>Direct download</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-primary rounded-full"></span>
                        <span>No ZIP extraction needed</span>
                      </div>
                    </div>
                  ) : (
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
                  )}
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