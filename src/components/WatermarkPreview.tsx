interface WatermarkSettings {
  text: string;
  opacity: number;
  fontSize: 'small' | 'medium' | 'large';
  color: string;
}

interface WatermarkPreviewProps {
  settings: WatermarkSettings;
  isLoading: boolean;
}

export const WatermarkPreview = ({ settings, isLoading }: WatermarkPreviewProps) => {
  const getFontSize = () => {
    switch (settings.fontSize) {
      case 'small': return 'text-lg';
      case 'large': return 'text-4xl';
      default: return 'text-2xl';
    }
  };

  const getOpacity = () => {
    return settings.opacity / 100;
  };

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">Updating preview...</span>
          </div>
        </div>
      )}
      
      <div className="bg-white border-2 border-dashed border-border rounded-lg p-8 min-h-[400px] relative overflow-hidden">
        {/* Document Content Simulation */}
        <div className="space-y-4 text-gray-600">
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Sample Document Title
            </h3>
            <p className="text-sm text-gray-500">
              College of Postgraduate School, Babcock University
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="h-2 bg-gray-200 rounded w-full"></div>
            <div className="h-2 bg-gray-200 rounded w-5/6"></div>
            <div className="h-2 bg-gray-200 rounded w-4/5"></div>
            <div className="h-2 bg-gray-200 rounded w-full"></div>
            <div className="h-2 bg-gray-200 rounded w-3/4"></div>
            
            <div className="py-4">
              <div className="h-2 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-2 bg-gray-200 rounded w-full"></div>
              <div className="h-2 bg-gray-200 rounded w-5/6"></div>
              <div className="h-2 bg-gray-200 rounded w-4/5"></div>
            </div>
            
            <div className="space-y-2">
              <div className="h-2 bg-gray-200 rounded w-full"></div>
              <div className="h-2 bg-gray-200 rounded w-3/4"></div>
              <div className="h-2 bg-gray-200 rounded w-5/6"></div>
              <div className="h-2 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>

        {/* Watermark Overlay */}
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{
            transform: 'rotate(-45deg)',
            opacity: getOpacity(),
          }}
        >
          <div 
            className={`font-bold ${getFontSize()} whitespace-nowrap select-none`}
            style={{ 
              color: settings.color,
              textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            {settings.text || 'College of Postgraduate School, BU'}
          </div>
        </div>

        {/* Preview Label */}
        <div className="absolute top-2 right-2">
          <span className="px-2 py-1 bg-primary text-white text-xs rounded-md font-medium">
            PREVIEW
          </span>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-muted-foreground">
          This preview shows how the watermark will appear on your documents
        </p>
      </div>
    </div>
  );
};