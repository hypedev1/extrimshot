import { Zap, Brain, Heart, Battery, Smile, Shield, Activity } from 'lucide-react';

const iconMap: Record<string, any> = {
  Zap, Brain, Heart, Battery, Smile, Shield, Activity
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

  return (
    <section className="py-16 px-4">
      <div className="container">
        <h2 className="text-2xl md:text-4xl font-bold text-center mb-4">
          {data.title}
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          {data.subtitle}
        </p>

        <div className="flex flex-col lg:flex-row gap-10 items-center">
          <div className="flex-1">
            <img 
              alt="Benefits" 
              className="rounded-2xl shadow-xl w-full max-w-sm mx-auto" 
              src={data.image} 
            />
          </div>

          <div className="flex-1 grid md:grid-cols-2 gap-6">
            {data.categories.map((category, catIndex) => {
              const CategoryIcon = iconMap[category.icon] || Zap;
              return (
                <div key={catIndex} className="space-y-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <CategoryIcon className="w-6 h-6 text-primary" />
                    {category.title}
                  </h3>
                  {category.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 bg-card/50 rounded-xl p-4 border border-border">
                      <Battery className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-sm">{item.title}</h4>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center mt-10">
          <a href="#order" className="btn-primary inline-block">
            {data.ctaText}
          </a>
        </div>
      </div>
    </section>
  );
};
