import { useState, useEffect } from 'react';
import { X, ShoppingBag, Clock } from 'lucide-react';

const purchases = [
  { name: 'রফিক মিয়া', location: 'চট্টগ্রাম', time: '৩০ মিনিট আগে' },
  { name: 'করিম সাহেব', location: 'ঢাকা', time: '১৫ মিনিট আগে' },
  { name: 'জহির উদ্দিন', location: 'সিলেট', time: '৪৫ মিনিট আগে' },
  { name: 'আব্দুল হালিম', location: 'রাজশাহী', time: '১ ঘন্টা আগে' },
  { name: 'সাইফুল ইসলাম', location: 'খুলনা', time: '২০ মিনিট আগে' },
];

export const RecentPurchasePopup = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (isDismissed) return;

    const showPopup = () => {
      setIsVisible(true);
      setTimeout(() => {
        setIsVisible(false);
        setCurrentIndex(prev => (prev + 1) % purchases.length);
      }, 5000);
    };

    const initialTimeout = setTimeout(showPopup, 3000);
    const interval = setInterval(showPopup, 12000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [isDismissed]);

  if (isDismissed || !isVisible) return null;

  const purchase = purchases[currentIndex];

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-slide-up">
      <div className="card-glass p-4 pr-10 max-w-[280px] relative">
        <button 
          onClick={() => setIsDismissed(true)}
          className="absolute top-2 right-2 p-1 hover:bg-secondary rounded-full transition-colors"
        >
          <X className="w-3 h-3 text-muted-foreground" />
        </button>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">{purchase.name}</p>
            <p className="text-xs text-muted-foreground">{purchase.location} থেকে</p>
            <p className="text-xs text-primary font-medium mt-1">Nobosokti কিনেছেন</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" />
              {purchase.time}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
