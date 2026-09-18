import { Check, Zap, Dumbbell, FlaskConical, Lock, Leaf, Heart, Shield, Clock, Sparkles, Star, Volume2, VolumeX } from 'lucide-react';
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
  image?: string;
  subtitle: string;
  badges: { text: string }[];
  ctaText: string;
  discount: string;
  features: { icon: string; title: string; desc: string }[];
}

interface HeroSectionProps {
  content?: HeroContent;
}

// Auto-play YouTube embed with top header cropped out (hides YouTube title, channel avatar, and channel name)
// Uses CSS overflow crop + controls=0 to provide a clean, distraction-free product video
const AutoPlayYouTube = ({ videoId }: { videoId: string }) => {
  const [loaded, setLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const toggleSound = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!iframeRef.current?.contentWindow) return;
    const nextMuted = !isMuted;
    iframeRef.current.contentWindow.postMessage(
      JSON.stringify({
        event: 'command',
        func: nextMuted ? 'mute' : 'unMute',
        args: [],
      }),
      '*'
    );
    setIsMuted(nextMuted);
  };

  return (
    <div 
      className="relative w-full h-full bg-black overflow-hidden select-none cursor-pointer group"
      onClick={() => isMuted && toggleSound()}
    >
      {/* 
        Crop wrapper:
        YouTube embeds place channel avatar, title, and channel name in the top 50-65px.
        By shifting the iframe up by 70px (-top-[70px]) and extending bottom by 70px (-bottom-[70px]),
        the entire YouTube header and bottom bar are pushed outside the container and clipped by overflow-hidden.
      */}
      <div className="absolute -top-[70px] -bottom-[70px] left-0 right-0 overflow-hidden pointer-events-none">
        <iframe
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&showinfo=0&loop=1&playlist=${videoId}&playsinline=1&enablejsapi=1&iv_load_policy=3`}
          className="w-full h-full border-0 pointer-events-auto"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          title="Product Video"
          onLoad={() => setLoaded(true)}
        />
      </div>

      {/* Modern floating sound toggle button */}
      {loaded && (
        <button
          type="button"
          onClick={toggleSound}
          className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 hover:bg-black/90 text-white text-xs font-medium backdrop-blur-md border border-white/20 shadow-lg transition-transform active:scale-95"
          title={isMuted ? 'সাউন্ড চালু করুন' : 'সাউন্ড বন্ধ করুন'}
        >
          {isMuted ? (
            <>
              <VolumeX className="w-3.5 h-3.5 text-amber-400" />
              <span>সাউন্ড শুনুন</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5 text-green-400 animate-pulse" />
              <span>সাউন্ড চালু</span>
            </>
          )}
        </button>
      )}

      {/* Poster thumbnail — shown while iframe loads, fades out once ready */}
      {!loaded && (
        <div className="absolute inset-0 z-10 bg-black">
          <img
            src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
            alt="Video thumbnail"
            className="w-full h-full object-cover"
          />
          {/* Subtle loading indicator */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
};


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
          
          {data.videoUrl && (() => {
            // Extract video ID from embed URL (e.g. https://www.youtube.com/embed/iOaQbkKdlYA?...)
            const videoIdMatch = data.videoUrl.match(/embed\/([a-zA-Z0-9_-]+)/);
            const videoId = videoIdMatch ? videoIdMatch[1] : '';
            return videoId ? (
              <div className="flex justify-center mb-8">
                <div className="w-[280px] h-[498px] md:w-[340px] md:h-[604px] rounded-2xl overflow-hidden shadow-xl border-4 border-primary/20">
                  <AutoPlayYouTube videoId={videoId} />
                </div>
              </div>
            ) : null;
          })()}

          {!data.videoUrl && data.image && (
            <div className="flex justify-center mb-8">
              <div className="relative">
                {/* Glowing background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-teal-light/40 rounded-full blur-3xl scale-110" />
                <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 to-green/20 rounded-full blur-2xl scale-105 animate-pulse" />
                
                {/* Product image container */}
                <div className="relative bg-gradient-to-br from-card to-background rounded-2xl md:rounded-3xl p-4 md:p-8 border-2 border-primary/20 shadow-2xl">
                  <img 
                    src={data.image} 
                    alt="Product" 
                    loading="lazy"
                    className="w-48 h-48 md:w-72 md:h-72 object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Discount badge */}
                  <div className="absolute -top-3 -right-3 md:-top-4 md:-right-4 bg-gradient-to-br from-accent to-orange text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-bold shadow-lg animate-bounce">
                    {data.discount}
                  </div>
                  
                  {/* Natural badge */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green to-emerald-600 text-white px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-xs font-medium shadow-md flex items-center gap-1">
                    <Leaf className="w-3 h-3" />
                    ১০০% প্রাকৃতিক
                  </div>
                </div>
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
                <p className="text-[10px] md:text-xs text-muted-foreground leading-tight">অর্ডার</p>
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