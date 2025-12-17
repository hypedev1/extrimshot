import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X, Leaf, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      {/* Top bar */}
      <div className="bg-primary/10 py-2 px-4">
        <div className="container flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="w-3 h-3" />
            <span>হটলাইন: 01XXX-XXXXXX</span>
          </div>
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
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform">
              <Leaf className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gradient">নোবোশক্তি</h1>
              <p className="text-xs text-muted-foreground">অর্গানিক বাংলাদেশ</p>
            </div>
          </Link>

          {/* Search bar - desktop */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="আপনার পছন্দের পণ্য খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full bg-secondary/50 border-border focus:border-primary rounded-full"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                0
              </span>
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="পণ্য খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-secondary/50 border-border rounded-full"
            />
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
