import { AlertTriangle } from 'lucide-react';

interface FinalCTAContent {
  title: string;
  subtitle: string;
  ctaText: string;
}

interface FinalCTASectionProps {
  content?: FinalCTAContent;
}

export const FinalCTASection = ({ content }: FinalCTASectionProps) => {
  const defaultContent: FinalCTAContent = {
    title: 'আজ সিদ্ধান্ত নিন – কাল থেকেই ফিল করুন ন্যাচারাল পাওয়ার!',
    subtitle: 'হাজারো মানুষ ইতিমধ্যে উপকৃত হয়েছেন। এবার আপনার পালা।',
    ctaText: 'এখনই অর্ডার করুন'
  };

  const data = content || defaultContent;

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-primary/10">
      <div className="container max-w-3xl text-center">
        <h2 className="text-2xl md:text-4xl font-bold mb-4">
          {data.title}
        </h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          {data.subtitle}
        </p>
        
        <a href="#order" className="btn-primary inline-block text-lg mb-6 pulse-glow">
          {data.ctaText}
        </a>

        <p className="text-red font-medium flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          স্টক সীমিত – অফার যে কোনো সময় শেষ হয়ে যেতে পারে
        </p>
      </div>
    </section>
  );
};
