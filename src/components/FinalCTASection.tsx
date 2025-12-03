import { AlertTriangle } from 'lucide-react';

export const FinalCTASection = () => {
  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-primary/10">
      <div className="container max-w-3xl text-center">
        <h2 className="text-2xl md:text-4xl font-bold mb-6">
          আজ সিদ্ধান্ত নিন – কাল থেকেই ফিল করুন ন্যাচারাল পাওয়ার!
        </h2>
        
        <a href="#order" className="btn-primary inline-block text-lg mb-6 pulse-glow">
          এখনই অর্ডার করুন
        </a>

        <p className="text-red font-medium flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          স্টক সীমিত – অফার যে কোনো সময় শেষ হয়ে যেতে পারে
        </p>
      </div>
    </section>
  );
};
