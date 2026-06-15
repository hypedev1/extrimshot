import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Menu, X, Sparkles, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <header className={`sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border transition-all duration-300 ${isScrolled ? 'shadow-md' : ''}`}>
      {/* Top bar - hides on scroll */}
      <div className={`bg-primary/10 overflow-hidden transition-all duration-300 ${isScrolled ? 'max-h-0 py-0' : 'max-h-20 py-2'}`}>
        <div className="container flex items-center justify-between text-sm px-4">
          <a href="tel:01335167183" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <Phone className="w-3 h-3" />
            <span>হটলাইন: 01335167183</span>
          </a>
          <div className="hidden md:flex items-center gap-4 text-muted-foreground">
            <span>🚚 সারা বাংলাদেশে ক্যাশ অন ডেলিভারি</span>
            <span>•</span>
            <span>✨ ৫০% পর্যন্ত ছাড়</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className={`container transition-all duration-300 ${isScrolled ? 'py-2' : 'py-4'}`}>
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className={`relative rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg shadow-emerald-500/30 ${isScrolled ? 'w-10 h-10' : 'w-12 h-12'}`}>
              <Sparkles className={`text-white transition-all duration-300 ${isScrolled ? 'w-5 h-5' : 'w-6 h-6'}`} />
              <div className={`absolute -top-1 -right-1 bg-amber-400 rounded-full animate-pulse transition-all duration-300 ${isScrolled ? 'w-2 h-2' : 'w-3 h-3'}`} />
            </div>
            <div className="hidden sm:block">
              <h1 className={`font-black tracking-tight transition-all duration-300 ${isScrolled ? 'text-xl' : 'text-2xl'}`}>
                <span className="bg-gradient-to-r from-emerald-600 via-green-500 to-teal-500 bg-clip-text text-transparent">Extrim</span>
                <span className="text-foreground ml-1">Shot</span>
              </h1>
              <p className={`text-muted-foreground font-medium transition-all duration-300 ${isScrolled ? 'text-[10px]' : 'text-xs'}`}>প্রাকৃতিক শক্তি • Natural Energy</p>
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
        {isMenuOpen && (
          <nav className="md:hidden mt-4 py-4 border-t border-border animate-fade-in">
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
          </nav>
        )}
      </div>
    </header>
  );
};
