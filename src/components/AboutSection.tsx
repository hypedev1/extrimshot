import { Check, Award, Beaker, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';

interface AboutContent {
  title: string;
  image: string;
  description: string;
  tags: string[];
  additionalInfo: string;
}

interface AboutSectionProps {
  content?: AboutContent;
}

export const AboutSection = ({ content }: AboutSectionProps) => {
  const defaultContent: AboutContent = {
    title: 'Extrimshot ন্যাচারাল পাওয়ার বুস্টার',
    image: '/lovable-uploads/12a04d91-3d2a-4274-8e85-16c00eae429a.webp',
    description: 'Extrimshot হলো একটি প্রাকৃতিক হার্বাল পাওয়ার বুস্টার শট।',
    tags: ['১০০% হার্বাল', 'স্টেরয়েড ফ্রি', 'নন-অ্যাডিক্টিভ'],
    additionalInfo: 'রিসার্চড ডোজে ব্যবহার করা উপাদানের জন্য এটি সেফভাবে কাজ করার জন্য তৈরি করা হয়েছে।'
  };

  const data = content || defaultContent;

  const highlights = [
    { icon: Award, text: 'প্রিমিয়াম কোয়ালিটি', color: 'from-primary to-teal-dark' },
    { icon: Beaker, text: 'ল্যাব টেস্টেড', color: 'from-accent to-orange' },
    { icon: ShieldCheck, text: 'সম্পূর্ণ নিরাপদ', color: 'from-green to-primary' }
  ];

  return (
    <section className="pt-8 md:pt-12 pb-16 md:pb-24 px-4 bg-gradient-to-b from-background via-card/30 to-background overflow-hidden">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            পণ্য পরিচিতি
          </span>
          <h2 className="text-2xl md:text-4xl font-bold text-foreground">
            {data.title}
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 max-w-6xl mx-auto">
          {/* Image with enhanced decorative elements */}
          <div className="flex-1 relative group">
            {/* Animated rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 md:w-80 md:h-80 rounded-full border-2 border-dashed border-primary/20 animate-spin-slow" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-52 h-52 md:w-64 md:h-64 rounded-full border border-accent/20" />
            </div>
            
            {/* Floating particles */}
            <div className="absolute top-10 left-10 w-3 h-3 bg-primary rounded-full animate-bounce-slow" />
            <div className="absolute bottom-20 right-10 w-2 h-2 bg-accent rounded-full animate-bounce-slow delay-300" />
            <div className="absolute top-1/2 left-0 w-2 h-2 bg-green rounded-full animate-bounce-slow delay-500" />
            
            {/* Main image container */}
            <div className="relative bg-gradient-to-br from-teal-light/50 via-background to-accent/10 p-6 md:p-10 rounded-3xl">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent rounded-3xl" />
              <img 
                alt="Product Image" 
                loading="lazy"
                className="relative z-10 w-full max-w-[280px] mx-auto drop-shadow-2xl group-hover:scale-105 transition-transform duration-500" 
                src={data.image} 
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6">
            {/* Description card */}
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <p className="text-lg text-foreground leading-relaxed relative">
                {data.description}
              </p>
            </div>

            {/* Tags with icons */}
            <div className="flex flex-wrap gap-3">
              {data.tags.map((item, i) => (
                <span 
                  key={i} 
                  className="flex items-center gap-2 bg-gradient-to-r from-primary/10 to-primary/5 text-primary rounded-xl px-4 py-2.5 text-sm font-semibold border border-primary/20 hover:border-primary/40 transition-colors"
                >
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  {item}
                </span>
              ))}
            </div>

            {/* Additional info */}
            <p className="text-muted-foreground leading-relaxed pl-4 border-l-2 border-primary/30">
              {data.additionalInfo}
            </p>

            {/* Highlight boxes - Enhanced */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {highlights.map((item, i) => (
                <div 
                  key={i} 
                  className="relative text-center p-4 bg-background rounded-2xl border border-border shadow-sm hover:shadow-md transition-all duration-300 group/card overflow-hidden"
                >
                  {/* Background gradient on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover/card:opacity-5 transition-opacity`} />
                  
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-md group-hover/card:scale-110 transition-transform`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">{item.text}</p>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <a 
              href="#order" 
              className="btn-primary inline-flex items-center gap-2 text-base"
            >
              এখনই অর্ডার করুন
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};