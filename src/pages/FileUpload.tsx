import { useState, useCallback } from "react";
import { Upload, FileText, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { FileDropzone } from "@/components/FileDropzone";
import { FileList } from "@/components/FileList";
import { useToast } from "@/hooks/use-toast";

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

  const handleFilesSelected = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = [];
    
    Array.from(selectedFiles).forEach((file: File) => {
      const isValid = validateFile(file);
      
      newFiles.push({
        id: `${Date.now()}-${Math.random()}`,
        file: file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: isValid ? 'valid' : 'invalid'
      });
    });

    setFiles(prev => [...prev, ...newFiles]);
  }, [toast]);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleUpload = async () => {
    const validFiles = files.filter(f => f.status === 'valid');
    
    if (validFiles.length === 0) {
      toast({
        title: "No valid files",
        description: "Please add valid PDF or Word documents before uploading.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    // Simulate upload process
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Upload successful!",
        description: `${validFiles.length} files have been uploaded and are ready for watermarking.`,
      });
      
      // Navigate to configuration page with files
      navigate('/configure', { state: { files: validFiles } });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const validFiles = files.filter(f => f.status === 'valid');
  const totalSize = validFiles.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="hover:bg-primary-light"
            >
              ← Back to Dashboard
            </Button>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Upload Documents for Watermarking
          </h1>
          <p className="text-muted-foreground text-lg">
            Select PDF and Word documents to add CPGS watermarks
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Dropzone */}
            <div className="animate-slide-up">
              <FileDropzone onFilesSelected={handleFilesSelected} />
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
                <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Selected Files ({files.length})
                    </CardTitle>
                    <CardDescription>
                      Review and manage your uploaded documents
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileList files={files} onRemove={removeFile} />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Summary & Actions */}
          <div className="lg:col-span-1 animate-scale-in" style={{ animationDelay: "300ms" }}>
            <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Batch Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stats */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Files:</span>
                    <span className="font-medium">{files.length}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Valid Files:</span>
                    <span className="font-medium text-green-600">{validFiles.length}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Size:</span>
                    <span className="font-medium">{(totalSize / (1024 * 1024)).toFixed(1)} MB</span>
                  </div>
                </div>

                {/* Upload Button */}
                <Button 
                  className="w-full bg-gradient-primary hover:scale-[1.02] transition-transform duration-200 shadow-elevated"
                  onClick={handleUpload}
                  disabled={validFiles.length === 0 || isUploading}
                  size="lg"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Start Watermarking
                    </>
                  )}
                </Button>

                {/* Requirements */}
                <div className="pt-4 border-t space-y-3">
                  <h4 className="font-medium text-sm">Requirements:</h4>
                  
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      PDF and Word documents only
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      Maximum 50MB per file
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-3 w-3 text-yellow-500" />
                      Files will be watermarked with "College of Postgraduate School, BU"
                    </div>
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