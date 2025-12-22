import { Zap, Brain, Heart, Battery, Smile, Shield, Activity, TrendingUp, Sparkles } from 'lucide-react';

const iconMap: Record<string, any> = {
  Zap, Brain, Heart, Battery, Smile, Shield, Activity, TrendingUp, Sparkles
};

interface BenefitsContent {
  title: string;
  subtitle: string;
  image: string;
  categories: {
    title: string;
    icon: string;
    items: { title: string; desc: string }[];
  }[];
  ctaText: string;
}

interface BenefitsSectionProps {
  content?: BenefitsContent;
}

export const BenefitsSection = ({ content }: BenefitsSectionProps) => {
  const defaultContent: BenefitsContent = {
    title: 'Extrimshot থেকে আপনি কী কী উপকার পেতে পারেন?',
    subtitle: 'হাজারো সন্তুষ্ট কাস্টমারের বাস্তব অভিজ্ঞতা',
    image: '/lovable-uploads/aeca2ff1-3195-4d8b-ac60-1bd8bd7f9078.png',
    categories: [],
    ctaText: 'আজই ট্রাই করুন – স্টক শেষ হওয়ার আগেই'
  };

  const data = content || defaultContent;

  // Default benefits if no categories provided
  const defaultBenefits = [
    { icon: 'Zap', title: 'তাৎক্ষণিক শক্তি', desc: 'দ্রুত এনার্জি বুস্ট' },
    { icon: 'Heart', title: 'হৃদযন্ত্র সুরক্ষা', desc: 'স্বাস্থ্যকর হার্ট' },
    { icon: 'Brain', title: 'মানসিক স্বচ্ছতা', desc: 'ফোকাস ও মেমোরি' },
    { icon: 'Shield', title: 'রোগ প্রতিরোধ', desc: 'ইমিউনিটি বুস্ট' },
    { icon: 'TrendingUp', title: 'স্ট্যামিনা বৃদ্ধি', desc: 'দীর্ঘস্থায়ী শক্তি' },
    { icon: 'Sparkles', title: 'সামগ্রিক সুস্থতা', desc: 'পূর্ণ স্বাস্থ্য' }
  ];

  const benefits = data.categories.length > 0 
    ? data.categories.flatMap(cat => cat.items.map((item, idx) => ({ ...item, icon: cat.icon || 'Zap' })))
    : defaultBenefits;

  return (
    <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-background to-card">
      <div className="container">
        <div className="text-center mb-12">
          <div className="section-divider" />
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
            {data.title}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {data.subtitle}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-center max-w-6xl mx-auto">
          {/* Product Image - Infographic Style */}
          <div className="flex-1 relative">
            <div className="bg-gradient-to-br from-primary/5 to-teal-light/50 rounded-3xl p-8 relative">
              {/* Decorative circles */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 border-2 border-dashed border-primary/20 rounded-full" />
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-64 h-64 border border-primary/10 rounded-full" />
              
              <img 
                alt="Benefits" 
                className="relative z-10 w-full max-w-xs mx-auto drop-shadow-lg" 
                src={data.image} 
              />
            </div>
          </div>

          {/* Benefits Grid - Infographic Cards */}
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-4">
              {benefits.slice(0, 6).map((item, i) => {
                const IconComponent = iconMap[item.icon] || Zap;
                return (
                  <div 
                    key={i} 
                    className="bg-background rounded-xl p-5 border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-bold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <a href="#order" className="btn-primary inline-block">
            {data.ctaText}
          </a>
        </div>
      </div>
    </section>
  );
};