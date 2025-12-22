import { Check, Zap, Dumbbell, FlaskConical, Lock, Leaf, Heart, Shield, Clock, Sparkles, Star } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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

// Particle component for confetti effect
const Particle = ({ delay, color }: { delay: number; color: string }) => (
  <div 
    className="absolute w-2 h-2 rounded-full animate-particle opacity-0"
    style={{
      backgroundColor: color,
      left: `${Math.random() * 100}%`,
      animationDelay: `${delay}ms`,
    }}
  />
);

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
  const [showParticles, setShowParticles] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShowParticles(true);
            // Hide particles after animation
            setTimeout(() => setShowParticles(false), 2000);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

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
  const particleColors = ['#2B9E9E', '#F97316', '#10B981', '#0D9488'];

  return (
    <section className="py-12 md:py-20 px-4 bg-gradient-to-b from-teal-light/50 to-background">
      <style>{`
        @keyframes particle {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-100px) scale(0);
          }
        }
        .animate-particle {
          animation: particle 1.5s ease-out forwards;
        }
      `}</style>
      
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

          {/* Trust Badge + CTA Button */}
          <div className="flex flex-col items-center gap-4">
            {/* Review Trust Badge */}
            <div className="flex items-center gap-3 bg-background border border-border rounded-full px-5 py-2.5 shadow-sm">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < 5 ? 'fill-accent text-accent' : 'text-muted-foreground'}`} 
                  />
                ))}
              </div>
              <div className="w-px h-5 bg-border" />
              <div className="text-sm">
                <span className="font-bold text-foreground">4.8</span>
                <span className="text-muted-foreground"> • </span>
                <span className="font-semibold text-primary">11,827+</span>
                <span className="text-muted-foreground"> রিভিউ</span>
              </div>
            </div>

            {/* CTA Button */}
            <a href="#order" className="btn-primary inline-block text-lg pulse-soft">
              {data.ctaText} – {data.discount}
            </a>
          </div>
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

        {/* Compact Stats Section - Mobile Optimized */}
        <div ref={statsRef} className="mt-8 md:mt-12 relative overflow-hidden">
          {/* Particle animation */}
          {showParticles && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(15)].map((_, i) => (
                <Particle 
                  key={i} 
                  delay={i * 100} 
                  color={particleColors[i % particleColors.length]} 
                />
              ))}
            </div>
          )}
          
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-green/5 rounded-xl md:rounded-2xl" />
          
          {/* Stats Grid - Compact on Mobile */}
          <div className="relative grid grid-cols-3 gap-2 md:gap-8 py-4 md:py-6 px-2 md:px-4">
            {/* Stat 1 */}
            <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3 text-center md:text-left group">
              <div className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary to-teal-dark flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <Heart className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <span className="text-lg md:text-2xl font-bold text-primary block">৫০K+</span>
                <p className="text-[10px] md:text-xs text-muted-foreground leading-tight">সন্তুষ্ট গ্রাহক</p>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3 text-center md:text-left group border-x border-border/50">
              <div className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-accent to-orange flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <Shield className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <span className="text-lg md:text-2xl font-bold text-accent block">৯৮%</span>
                <p className="text-[10px] md:text-xs text-muted-foreground leading-tight">সফলতার হার</p>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3 text-center md:text-left group">
              <div className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-green to-primary flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <Leaf className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <span className="text-lg md:text-2xl font-bold text-green block">১০০%</span>
                <p className="text-[10px] md:text-xs text-muted-foreground leading-tight">প্রাকৃতিক</p>
              </div>
            </div>
          </div>

          {/* Trust badges - Single line on mobile */}
          <div className="flex justify-center items-center gap-2 md:gap-3 pb-3 md:pb-4 px-2">
            <span className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
              <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3 text-primary" /> ল্যাব টেস্টেড
            </span>
            <span className="text-border text-[10px]">•</span>
            <span className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
              <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3 text-primary" /> ডাক্তার রেকমেন্ডেড
            </span>
            <span className="text-border text-[10px]">•</span>
            <span className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
              <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3 text-primary" /> গ্যারান্টি
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};