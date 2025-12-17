import { Link } from 'react-router-dom';
import { Leaf, Phone, Mail, MapPin, Facebook, Instagram, Youtube } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      {/* Main footer */}
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Leaf className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gradient">নোবোশক্তি</h3>
                <p className="text-xs text-muted-foreground">অর্গানিক বাংলাদেশ</p>
              </div>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              বাংলাদেশের সেরা অর্গানিক পণ্যের একমাত্র ঠিকানা। ১০০% প্রাকৃতিক, কেমিক্যাল মুক্ত পণ্য।
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4">দ্রুত লিংক</h4>
            <ul className="space-y-3">
              {['সকল পণ্য', 'অফার', 'আমাদের সম্পর্কে', 'যোগাযোগ', 'ব্লগ'].map((link, i) => (
                <li key={i}>
                  <Link to="/" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-bold mb-4">ক্যাটাগরি</h4>
            <ul className="space-y-3">
              {['শক্তি ও জীবনীশক্তি', 'স্বাস্থ্য ও সুস্থতা', 'রোগ প্রতিরোধ', 'ওজন নিয়ন্ত্রণ', 'সৌন্দর্য ও যত্ন'].map((cat, i) => (
                <li key={i}>
                  <Link to="/" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-4">যোগাযোগ</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">হটলাইন</p>
                  <p className="text-muted-foreground text-sm">01XXX-XXXXXX</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">ইমেইল</p>
                  <p className="text-muted-foreground text-sm">support@noboshokti.com</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">ঠিকানা</p>
                  <p className="text-muted-foreground text-sm">ঢাকা, বাংলাদেশ</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border py-6">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© ২০২৪ নোবোশক্তি। সর্বস্বত্ব সংরক্ষিত।</p>
          <div className="flex gap-6">
            <Link to="/" className="hover:text-primary transition-colors">গোপনীয়তা নীতি</Link>
            <Link to="/" className="hover:text-primary transition-colors">শর্তাবলী</Link>
            <Link to="/" className="hover:text-primary transition-colors">রিফান্ড পলিসি</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
