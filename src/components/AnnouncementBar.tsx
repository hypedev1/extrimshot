import { useState, useEffect } from 'react';
import { X, Flame, Truck, Clock } from 'lucide-react';
export const AnnouncementBar = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 16,
    minutes: 29,
    seconds: 21
  });
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let {
          hours,
          minutes,
          seconds
        } = prev;
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
        }
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
        if (hours < 0) {
          hours = 23;
        }
        return {
          hours,
          minutes,
          seconds
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  if (!isVisible) return null;
  const formatTime = (num: number) => num.toString().padStart(2, '0');
  return <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border-b border-primary/30 py-2.5 px-4 relative">
      <div className="container flex items-center justify-center gap-2 md:gap-6 text-sm md:text-base flex-wrap">
        <span className="flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-primary" />
          <span className="text-foreground">আজই অর্ডার করুন <span className="text-primary font-bold">৪০% ছাড়ে!</span></span>
        </span>
        <span className="hidden md:inline text-muted-foreground">|</span>
        <span className="flex items-center gap-1.5">
          <Truck className="w-4 h-4 text-accent" />
          <span className="text-foreground">ফ্রি ডেলিভারি সারা বাংলাদেশে     </span>
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-red" />
          <span className="text-foreground">অফার শেষ: </span>
          <span className="font-mono font-bold text-primary">
            {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
          </span>
        </span>
      </div>
      <button onClick={() => setIsVisible(false)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded-full transition-colors">
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>;
};