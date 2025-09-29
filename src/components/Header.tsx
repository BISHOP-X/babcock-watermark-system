import { FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="bg-card/95 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50 shadow-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/')}
          >
            <div className="p-2 bg-gradient-primary rounded-lg shadow-elevated">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                CPGS Document Watermarking
              </h1>
              <p className="text-sm text-muted-foreground">
                Babcock University
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            <Button
              variant={location.pathname === '/' ? 'default' : 'ghost'}
              onClick={() => navigate('/')}
              className="transition-all duration-200"
            >
              Dashboard
            </Button>
            
            <Button
              variant={location.pathname === '/upload' ? 'default' : 'ghost'}
              onClick={() => navigate('/upload')}
              className="transition-all duration-200"
            >
              <FileText className="mr-2 h-4 w-4" />
              Upload
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(location.pathname === '/' ? '/upload' : '/')}
            >
              <FileText className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};