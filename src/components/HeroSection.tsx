import { Check, Zap, Dumbbell, FlaskConical, Lock, Leaf, Heart, Shield, Clock } from 'lucide-react';

const iconMap: Record<string, any> = {
  Zap, Dumbbell, FlaskConical, Lock, Leaf, Heart, Shield, Clock, Check
};

// Infographic colors for each feature card
const cardStyles = [
  { bg: 'bg-primary/10', iconBg: 'bg-primary', border: 'border-primary/20', accent: 'text-primary' },
  { bg: 'bg-accent/10', iconBg: 'bg-accent', border: 'border-accent/20', accent: 'text-accent' },
  { bg: 'bg-green/10', iconBg: 'bg-green', border: 'border-green/20', accent: 'text-green' },
  { bg: 'bg-teal-dark/10', iconBg: 'bg-teal-dark', border: 'border-teal-dark/20', accent: 'text-teal-dark' },
];

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
    badges: [{ text: '১০০% প্রাকৃতিক ভেষজ' }, { text: 'ক্যাশ অন ডেলিভারি' }, { text: '৫০,০০০+ সন্তুষ্ট রোগী' }],
    ctaText: 'এখনই অর্ডার করুন',
    discount: '৪৮% ছাড়',
    features: [
      { icon: 'Leaf', title: 'ভেষজ সূত্র', desc: 'প্রাকৃতিক উপাদানে তৈরি' },
      { icon: 'Heart', title: 'সুগার কন্ট্রোল', desc: 'রক্তে শর্করা নিয়ন্ত্রণ' },
      { icon: 'Shield', title: 'নিরাপদ ব্যবহার', desc: 'কোন পার্শ্বপ্রতিক্রিয়া নেই' },
      { icon: 'Clock', title: 'দীর্ঘমেয়াদী ফলাফল', desc: 'স্থায়ী সুস্থতা' }
    ]
  };

  const data = content || defaultContent;

  return (
    <section className="py-12 md:py-20 px-4 bg-gradient-to-b from-teal-light/50 to-background">
      <div className="container">
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6 text-foreground">
            {data.title}
          </h1>
          
          {data.videoUrl && (
            <div className="flex justify-center mb-8">
              <div className="w-[280px] h-[498px] md:w-[340px] md:h-[604px] rounded-2xl overflow-hidden shadow-xl border-4 border-primary/20">
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

          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            {data.subtitle}
          </p>

          {/* Badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {data.badges.map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{item.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <a href="#order" className="btn-primary inline-block text-lg pulse-soft">
            {data.ctaText} – {data.discount}
          </a>
        </div>

        {/* Infographic Features Grid - Enhanced */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto mt-12">
          {data.features.map((item, i) => {
            const IconComponent = iconMap[item.icon] || Zap;
            const style = cardStyles[i % cardStyles.length];
            return (
              <div 
                key={i} 
                className={`relative overflow-hidden rounded-2xl p-6 ${style.bg} border ${style.border} group hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
              >
                {/* Decorative circle */}
                <div className={`absolute -top-6 -right-6 w-24 h-24 ${style.iconBg} opacity-10 rounded-full`} />
                
                {/* Icon with ring */}
                <div className="relative mb-4">
                  <div className={`w-16 h-16 ${style.iconBg} rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  {/* Animated ring */}
                  <div className={`absolute inset-0 w-16 h-16 mx-auto border-2 ${style.border} rounded-2xl animate-ping opacity-20`} />
                </div>
                
                {/* Content */}
                <div className="text-center relative">
                  <h3 className={`font-bold text-lg mb-2 ${style.accent}`}>{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>

                {/* Bottom accent line */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 ${style.iconBg} opacity-50 group-hover:opacity-100 transition-opacity`} />
              </div>
            );
          })}
        </div>

        {/* Enhanced Stats Section */}
        <div className="mt-16 relative">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-green/5 rounded-3xl" />
          
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 p-8 md:p-12">
            {/* Stat 1 */}
            <div className="flex flex-col items-center text-center group relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-teal-dark flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <div className="relative">
                <span className="text-4xl md:text-5xl font-bold text-primary">৫০,০০০+</span>
                <div className="absolute -top-2 -right-4 w-3 h-3 bg-primary rounded-full animate-ping" />
              </div>
              <p className="text-muted-foreground mt-2 font-medium">সন্তুষ্ট গ্রাহক</p>
              {/* Divider for desktop */}
              <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-20 bg-gradient-to-b from-transparent via-border to-transparent" />
            </div>

            {/* Stat 2 */}
            <div className="flex flex-col items-center text-center group relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-orange flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <div className="relative">
                <span className="text-4xl md:text-5xl font-bold text-accent">৯৮%</span>
                <div className="absolute -top-2 -right-4 w-3 h-3 bg-accent rounded-full animate-ping delay-300" />
              </div>
              <p className="text-muted-foreground mt-2 font-medium">সফলতার হার</p>
              {/* Divider for desktop */}
              <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-20 bg-gradient-to-b from-transparent via-border to-transparent" />
            </div>

            {/* Stat 3 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green to-primary flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Leaf className="w-10 h-10 text-white" />
              </div>
              <div className="relative">
                <span className="text-4xl md:text-5xl font-bold text-green">১০০%</span>
                <div className="absolute -top-2 -right-4 w-3 h-3 bg-green rounded-full animate-ping delay-500" />
              </div>
              <p className="text-muted-foreground mt-2 font-medium">প্রাকৃতিক উপাদান</p>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-4 mt-6 pb-4">
            <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm border border-border">
              <Check className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-foreground">ল্যাব টেস্টেড</span>
            </div>
            <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm border border-border">
              <Check className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-foreground">ডাক্তার রেকমেন্ডেড</span>
            </div>
            <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm border border-border">
              <Check className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-foreground">মানি ব্যাক গ্যারান্টি</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};