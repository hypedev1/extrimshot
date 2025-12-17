import { Check, Zap, Dumbbell, FlaskConical, Lock, Leaf, Heart, Shield, Clock } from 'lucide-react';

const iconMap: Record<string, any> = {
  Zap, Dumbbell, FlaskConical, Lock, Leaf, Heart, Shield, Clock, Check
};

interface HeroContent {
  title: string;
  videoUrl?: string;
  subtitle: string;
  badges: { text: string }[];
  ctaText: string;
  discount: string;
  features: { icon: string; title: string; desc: string }[];
}

interface HeroSectionProps {
  content?: HeroContent;
}

export const HeroSection = ({ content }: HeroSectionProps) => {
  const defaultContent: HeroContent = {
    title: 'ডক্টর এ আর খান এর রেকমেন্ডেড প্রডাক্ট এক্সট্রিমশট',
    videoUrl: 'https://www.youtube.com/embed/iOaQbkKdlYA?autoplay=1&mute=0&controls=0&modestbranding=1&rel=0&showinfo=0&loop=1&playlist=iOaQbkKdlYA&playsinline=1',
    subtitle: 'দিনের ক্লান্তি, স্ট্রেস, লো এনার্জি… সব ভুলে আবারও অনুভব করুন তরুন উদ্যম।',
    badges: [{ text: 'কোন প্রকার কেমিকেল নেই' }, { text: 'Cash on Delivery' }, { text: '100000+ কাস্টমার' }],
    ctaText: 'এখনই অর্ডার করুন',
    discount: '৫০% ডিসকাউন্ট',
    features: [
      { icon: 'Zap', title: 'তাৎক্ষণিক এনার্জি', desc: '৩০ মিনিটে পাওয়ার বুস্ট' },
      { icon: 'Dumbbell', title: 'স্ট্যামিনা সাপোর্ট', desc: 'দীর্ঘক্ষণ এনার্জি ধরে রাখুন' },
      { icon: 'FlaskConical', title: '১০০% ন্যাচারাল', desc: 'স্টেরয়েড ও কেমিক্যাল মুক্ত' },
      { icon: 'Lock', title: 'ডিসক্রিট প্যাকেজিং', desc: 'সম্পূর্ণ গোপনীয়তা' }
    ]
  };

  const data = content || defaultContent;

  return (
    <section className="py-12 md:py-20 px-4">
      <div className="container">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            {data.title}
            <span className="text-gradient"></span>
          </h1>
          
          {data.videoUrl && (
            <div className="flex justify-center mb-8">
              <div className="w-[300px] h-[533px] md:w-[360px] md:h-[640px] rounded-2xl overflow-hidden shadow-2xl">
                <iframe 
                  src={data.videoUrl} 
                  className="w-full h-full" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen 
                  title="Product Video" 
                />
              </div>
            </div>
          )}

          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            {data.subtitle}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center lg:gap-16 gap-0">
          <div className="flex-1 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
            </div>
          </div>

          <div className="flex-1 space-y-6">
            <div className="flex flex-wrap justify-center lg:justify-start mb-8 gap-[10px]">
              {data.badges.map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-4 py-2">
                  <Check className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>

            <a href="#order" className="btn-primary block text-center text-lg pulse-glow">
              {data.ctaText} – {data.discount}
            </a>

            <div className="grid grid-cols-2 gap-4 mt-8">
              {data.features.map((item, i) => {
                const IconComponent = iconMap[item.icon] || Zap;
                return (
                  <div key={i} className="card-glass p-4 text-center">
                    <IconComponent className="w-8 h-8 text-primary mx-auto mb-2" />
                    <h3 className="font-bold text-sm">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
