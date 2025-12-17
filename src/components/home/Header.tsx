import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Menu, X, Sparkles, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      {/* Top bar */}
      <div className="bg-primary/10 py-2 px-4">
        <div className="container flex items-center justify-between text-sm">
          <a href="tel:01335167186" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <Phone className="w-3 h-3" />
            <span>হটলাইন: 01335167186</span>
          </a>
          <div className="hidden md:flex items-center gap-4 text-muted-foreground">
            <span>🚚 সারা বাংলাদেশে ক্যাশ অন ডেলিভারি</span>
            <span>•</span>
            <span>✨ ৫০% পর্যন্ত ছাড়</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg shadow-emerald-500/30">
              <Sparkles className="w-6 h-6 text-white" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-emerald-600 via-green-500 to-teal-500 bg-clip-text text-transparent">Extrim</span>
                <span className="text-foreground ml-1">Shot</span>
              </h1>
              <p className="text-xs text-muted-foreground font-medium">প্রাকৃতিক শক্তি • Natural Energy</p>
            </div>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                0
              </span>
            </Button>
            
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && <nav className="md:hidden mt-4 py-4 border-t border-border animate-fade-in">
            <ul className="space-y-2">
              <li>
                <Link to="/" className="block py-2 px-4 rounded-lg hover:bg-secondary/50 transition-colors">
                  হোম
                </Link>
              </li>
              <li>
                <Link to="/" className="block py-2 px-4 rounded-lg hover:bg-secondary/50 transition-colors">
                  সকল পণ্য
                </Link>
              </li>
              <li>
                <Link to="/" className="block py-2 px-4 rounded-lg hover:bg-secondary/50 transition-colors">
                  অফার
                </Link>
              </li>
              <li>
                <Link to="/" className="block py-2 px-4 rounded-lg hover:bg-secondary/50 transition-colors">
                  যোগাযোগ
                </Link>
              </li>
            </ul>
          </nav>}
      </div>
    </header>;
};
