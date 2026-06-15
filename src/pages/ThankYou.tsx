import { CheckCircle, Phone, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const ThankYou = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="card-glass p-8 md:p-12">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-primary" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-4">
            ধন্যবাদ! 🎉
          </h1>
          
          <p className="text-xl text-foreground mb-2">
            আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে!
          </p>
          
          <p className="text-muted-foreground mb-8">
            শীঘ্রই আমাদের টিম আপনার সাথে যোগাযোগ করবে অর্ডার কনফার্ম করতে।
          </p>
          
          <div className="bg-secondary/50 rounded-xl p-4 mb-8">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span>কোনো প্রশ্ন থাকলে কল করুন: <strong className="text-foreground">01335167183</strong></span>
            </div>
          </div>
          
          <Link 
            to="/" 
            className="btn-primary inline-flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            হোমপেজে ফিরে যান
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
