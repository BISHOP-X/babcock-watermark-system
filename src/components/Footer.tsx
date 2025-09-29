import { Shield, Copyright, Mail, Phone, MapPin } from "lucide-react";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card/95 backdrop-blur-sm border-t border-border/50 mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* University Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">CPGS</span>
            </div>
            <p className="text-sm text-muted-foreground">
              College of Postgraduate School<br />
              Babcock University<br />
              Professional Document Watermarking System
            </p>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Contact Information</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>cpgs@babcock.edu.ng</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+234 (0) 803-761-3333</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Ilishan-Remo, Ogun State, Nigeria</span>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">System Information</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Secure document processing</p>
              <p>PDF & Word support</p>
              <p>Professional watermarking</p>
              <p>Academic review ready</p>
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 mt-8 pt-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Copyright className="h-4 w-4" />
              <span>
                {currentYear} Babcock University. All rights reserved.
              </span>
            </div>
            
            <div className="text-sm text-muted-foreground">
              CPGS Document Watermarking System v1.0
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};