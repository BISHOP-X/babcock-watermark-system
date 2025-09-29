import { FileText, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'valid' | 'invalid';
}

interface FileListProps {
  files: UploadedFile[];
  onRemove: (id: string) => void;
}

export const FileList = ({ files, onRemove }: FileListProps) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    return <FileText className="h-5 w-5 text-blue-500" />;
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'valid':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'invalid':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBg = (status: UploadedFile['status']) => {
    switch (status) {
      case 'valid':
        return 'bg-green-50 border-green-200';
      case 'invalid':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-3">
      {files.map((file, index) => (
        <div 
          key={file.id}
          className={`p-4 rounded-lg border transition-all duration-200 animate-fade-in ${getStatusBg(file.status)}`}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {getFileIcon(file.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground truncate">
                  {file.name}
                </h4>
                <div className="flex items-center gap-2">
                  {getStatusIcon(file.status)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(file.id)}
                    className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
                <p className={`text-xs font-medium ${
                  file.status === 'valid' ? 'text-green-600' : 
                  file.status === 'invalid' ? 'text-red-600' : 
                  'text-gray-600'
                }`}>
                  {file.status === 'valid' ? 'Ready' :
                   file.status === 'invalid' ? 'Invalid' : 
                   'Checking...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};