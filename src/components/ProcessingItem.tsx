import { CheckCircle2, Clock, AlertCircle, FileText } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface ProcessingFile {
  id: string;
  name: string;
  size: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

interface ProcessingItemProps {
  file: ProcessingFile;
  index: number;
  animationDelay: number;
}

export const ProcessingItem = ({ file, index, animationDelay }: ProcessingItemProps) => {
  const getStatusIcon = () => {
    switch (file.status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
        );
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBg = () => {
    switch (file.status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'processing':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = () => {
    switch (file.status) {
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'processing':
        return 'Processing...';
      default:
        return 'Queued';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div 
      className={`p-4 rounded-lg border transition-all duration-200 animate-fade-in ${getStatusBg()}`}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-foreground truncate">
              {file.name}
            </h4>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <Badge 
                variant={
                  file.status === 'completed' ? 'default' :
                  file.status === 'failed' ? 'destructive' :
                  file.status === 'processing' ? 'secondary' :
                  'outline'
                }
                className="text-xs"
              >
                {getStatusText()}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>{formatFileSize(file.size)}</span>
            {file.status === 'processing' && (
              <span>{file.progress}%</span>
            )}
          </div>

          {file.status === 'processing' && (
            <Progress value={file.progress} className="h-2" />
          )}

          {file.status === 'failed' && file.error && (
            <p className="text-xs text-red-600 mt-1">
              {file.error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};