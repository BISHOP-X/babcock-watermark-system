import { FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="bg-card/95 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50 shadow-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div 
            className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-80 transition-opacity touch-manipulation min-h-[44px]"
            onClick={() => navigate('/')}
          >
            <div className="p-2 bg-gradient-primary rounded-lg shadow-elevated flex-shrink-0">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-bold text-foreground leading-tight truncate">
                CPGS Document Watermarking
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-tight">
                Babcock University
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-3 lg:gap-4">
            <Button
              variant={location.pathname === '/' ? 'default' : 'ghost'}
              onClick={() => navigate('/')}
              className="transition-all duration-200 min-h-[44px] touch-manipulation"
              size="sm"
            >
              Dashboard
            </Button>
            
            <Button
              variant={location.pathname === '/upload' ? 'default' : 'ghost'}
              onClick={() => navigate('/upload')}
              className="transition-all duration-200 min-h-[44px] touch-manipulation"
              size="sm"
            >
              <FileText className="mr-2 h-4 w-4" />
              Upload
            </Button>
          </nav>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center gap-2">
            <Button
              variant={location.pathname === '/' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate('/')}
              className="min-h-[44px] touch-manipulation"
            >
              <span className="sr-only">Dashboard</span>
              🏠
            </Button>
            <Button
              variant={location.pathname === '/upload' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate('/upload')}
              className="min-h-[44px] touch-manipulation"
            >
              <FileText className="h-4 w-4" />
              <span className="sr-only">Upload</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};