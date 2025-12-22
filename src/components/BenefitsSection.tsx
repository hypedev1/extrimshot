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

  // Default benefits with colors for infographic style
  const defaultBenefits = [
    { icon: 'Zap', title: 'তাৎক্ষণিক শক্তি', desc: 'দ্রুত এনার্জি বুস্ট', color: 'from-amber-500 to-orange-500' },
    { icon: 'Heart', title: 'হৃদযন্ত্র সুরক্ষা', desc: 'স্বাস্থ্যকর হার্ট', color: 'from-rose-500 to-pink-500' },
    { icon: 'Brain', title: 'মানসিক স্বচ্ছতা', desc: 'ফোকাস ও মেমোরি', color: 'from-violet-500 to-purple-500' },
    { icon: 'Shield', title: 'রোগ প্রতিরোধ', desc: 'ইমিউনিটি বুস্ট', color: 'from-emerald-500 to-teal-500' },
    { icon: 'TrendingUp', title: 'স্ট্যামিনা বৃদ্ধি', desc: 'দীর্ঘস্থায়ী শক্তি', color: 'from-blue-500 to-cyan-500' },
    { icon: 'Sparkles', title: 'সামগ্রিক সুস্থতা', desc: 'পূর্ণ স্বাস্থ্য', color: 'from-primary to-teal-dark' }
  ];

  const benefits = data.categories.length > 0 
    ? data.categories.flatMap(cat => cat.items.map((item, idx) => ({ ...item, icon: cat.icon || 'Zap', color: defaultBenefits[idx % 6].color })))
    : defaultBenefits;

  return (
    <section className="py-10 md:py-20 px-4 bg-gradient-to-b from-background via-card/50 to-background overflow-hidden">
      <div className="container max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8 md:mb-14">
          <span className="inline-block px-3 py-1 md:px-4 md:py-1.5 bg-primary/10 text-primary text-xs md:text-sm font-medium rounded-full mb-3 md:mb-4">
            ✨ উপকারিতা
          </span>
          <h2 className="text-xl md:text-4xl font-bold text-foreground mb-2 md:mb-4 leading-tight">
            {data.title}
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
            {data.subtitle}
          </p>
        </div>

        {/* Infographic Layout */}
        <div className="relative">
          {/* Central Product - Hidden on mobile, visible on lg */}
          <div className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="relative">
              {/* Glowing rings */}
              <div className="absolute inset-0 w-48 h-48 rounded-full bg-gradient-to-br from-primary/20 to-teal-light/30 blur-2xl animate-pulse" />
              <div className="relative w-40 h-40 rounded-full bg-gradient-to-br from-card to-background border-2 border-primary/20 flex items-center justify-center shadow-xl">
                <img 
                  alt="Benefits" 
                  className="w-32 h-32 object-contain drop-shadow-lg" 
                  src={data.image} 
                />
              </div>
            </div>
          </div>

          {/* Benefits Grid - Infographic Style */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 lg:gap-6">
            {benefits.slice(0, 6).map((item, i) => {
              const IconComponent = iconMap[item.icon] || Zap;
              const isLeft = i % 3 === 0 || i % 3 === 2;
              
              return (
                <div 
                  key={i} 
                  className={`
                    relative group
                    ${i === 1 || i === 4 ? 'lg:mt-16' : ''}
                  `}
                >
                  {/* Card */}
                  <div className="relative bg-card/80 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-5 border border-border/50 shadow-sm hover:shadow-lg hover:border-primary/40 transition-all duration-300 hover:-translate-y-1">
                    {/* Icon with gradient */}
                    <div className={`w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-2 md:mb-3 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-4 h-4 md:w-6 md:h-6 text-white" />
                    </div>
                    
                    {/* Content */}
                    <h4 className="font-bold text-foreground text-xs md:text-base mb-0.5 md:mb-1 leading-tight">{item.title}</h4>
                    <p className="text-[10px] md:text-sm text-muted-foreground leading-snug">{item.desc}</p>
                    
                    {/* Decorative number */}
                    <span className="absolute top-2 right-2 md:top-3 md:right-3 text-lg md:text-2xl font-bold text-muted/20 group-hover:text-primary/20 transition-colors">
                      0{i + 1}
                    </span>
                  </div>
                  
                  {/* Connector line - only on desktop */}
                  <div className={`hidden lg:block absolute top-1/2 ${isLeft ? 'right-0 translate-x-full' : 'left-0 -translate-x-full'} w-8 h-px bg-gradient-to-r from-primary/30 to-transparent`} />
                </div>
              );
            })}
          </div>

          {/* Mobile Product Image */}
          <div className="lg:hidden mt-6 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-teal-light/30 blur-xl" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-card to-background border-2 border-primary/20 flex items-center justify-center shadow-lg">
                <img 
                  alt="Benefits" 
                  className="w-20 h-20 object-contain" 
                  src={data.image} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-8 md:mt-14">
          <a href="#order" className="btn-primary inline-flex items-center gap-2 text-sm md:text-base px-6 md:px-8 py-2.5 md:py-3 shadow-lg hover:shadow-xl transition-shadow">
            {data.ctaText}
            <Sparkles className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
};
