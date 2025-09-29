import { useCallback, useState } from "react";
import { Upload, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";

interface FileDropzoneProps {
  onFilesSelected: (files: FileList | null) => void;
}

export const FileDropzone = ({ onFilesSelected }: FileDropzoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    onFilesSelected(files);
  }, [onFilesSelected]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    onFilesSelected(files);
    // Reset input value to allow selecting same files again
    e.target.value = '';
  }, [onFilesSelected]);

  return (
    <Card 
      className={`shadow-card border-2 border-dashed transition-all duration-300 cursor-pointer hover:shadow-elevated ${
        isDragOver 
          ? 'border-primary bg-primary-light/20 scale-[1.02]' 
          : 'border-border hover:border-primary/50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="p-8 md:p-12 text-center">
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="flex flex-col items-center gap-4">
            <div className={`p-4 rounded-full transition-all duration-300 ${
              isDragOver ? 'bg-primary text-white' : 'bg-primary-light text-primary'
            }`}>
              <Upload className="h-8 w-8" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">
                {isDragOver ? 'Drop files here' : 'Upload Documents'}
              </h3>
              <p className="text-muted-foreground">
                Drag and drop files here, or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                Supports PDF and Word documents up to 50MB each
              </p>
            </div>
            
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4 text-red-500" />
                PDF
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4 text-blue-500" />
                Word
              </div>
            </div>
          </div>
        </label>
      </div>
    </Card>
  );
};