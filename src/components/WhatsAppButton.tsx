import { useEffect, useState } from "react";

const WHATSAPP_NUMBER = "8801335167193";
const PREFILL_MESSAGE = "আমি অর্ডার করতে চাচ্ছি, আমাকে সহায়তা করুন।";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(PREFILL_MESSAGE)}`;

const WhatsAppIcon = ({ className = "w-7 h-7" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.347-.347.52-.52.174-.174.232-.298.347-.497.116-.198.058-.371-.015-.52-.074-.149-.66-1.59-.904-2.178-.238-.574-.48-.497-.66-.506-.171-.008-.367-.01-.563-.01-.196 0-.515.074-.784.372-.269.297-1.025 1.002-1.025 2.443 0 1.441 1.05 2.833 1.197 3.03.148.198 2.066 3.156 5.006 4.427.7.302 1.246.483 1.672.618.703.223 1.342.192 1.848.116.564-.084 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
  </svg>
);

const WhatsAppButton = () => {
  const [pulseOn, setPulseOn] = useState(false);

  // Gentle, occasional pulse — brief ring every ~9 seconds, never continuous
  useEffect(() => {
    let cancelled = false;
    let offTimer: number;
    const loop = () => {
      if (cancelled) return;
      setPulseOn(true);
      offTimer = window.setTimeout(() => setPulseOn(false), 1400);
      intervalTimer = window.setTimeout(loop, 9000);
    };
    let intervalTimer: number;
    intervalTimer = window.setTimeout(loop, 4000);
    return () => {
      cancelled = true;
      clearTimeout(intervalTimer);
      clearTimeout(offTimer);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 print:hidden">
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="group relative flex items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-xl transition-all duration-300 ease-out md:w-auto md:h-auto md:px-5 md:py-3.5 md:gap-2.5 h-14 w-14 hover:scale-105 hover:-translate-y-0.5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
      >
        {/* Subtle expanding ring — only during occasional pulse */}
        <span
          aria-hidden="true"
          className={`absolute inset-0 rounded-full bg-[#25D366]/50 pointer-events-none transition-opacity duration-700 ${
            pulseOn ? "opacity-100 animate-[whatsapp-ping_1.4s_ease-out]" : "opacity-0"
          }`}
        />
        <WhatsAppIcon className="w-7 h-7 shrink-0 md:w-6 md:h-6" />
        {/* Desktop-only label */}
        <span className="hidden md:inline text-sm font-semibold tracking-wide whitespace-nowrap select-none">
          হোয়াটসঅ্যাপে কথা বলুন
        </span>
        <span className="sr-only md:hidden">Chat with us</span>
      </a>
    </div>
  );
};

export default WhatsAppButton;
