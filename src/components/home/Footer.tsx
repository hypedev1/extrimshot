import { Link } from 'react-router-dom';
import { Sparkles, Phone, Mail } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-emerald-600 via-green-500 to-teal-500 bg-clip-text text-transparent">Extrim</span>
                <span className="text-foreground ml-1">Shot</span>
              </h3>
              <p className="text-xs text-muted-foreground">প্রাকৃতিক শক্তি • Natural Energy</p>
            </div>
          </Link>

          {/* Contact */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 text-sm">
            <a href="tel:01335167186" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <Phone className="w-4 h-4" />
              <span>01335167186</span>
            </a>
            <a href="mailto:support@extrimshot.com" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <Mail className="w-4 h-4" />
              <span>support@extrimshot.com</span>
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-6 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
          <p>© ২০২৪ Extrim Shot। সর্বস্বত্ব সংরক্ষিত।</p>
          <div className="flex gap-4">
            <Link to="/" className="hover:text-primary transition-colors">গোপনীয়তা নীতি</Link>
            <Link to="/" className="hover:text-primary transition-colors">শর্তাবলী</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
