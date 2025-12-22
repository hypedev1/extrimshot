import { X, Check, Frown, Smile, ArrowRight } from 'lucide-react';

interface BeforeAfterContent {
  title: string;
  before: { title: string; items: string[] };
  after: { title: string; items: string[] };
}

interface BeforeAfterSectionProps {
  content?: BeforeAfterContent;
}

export const BeforeAfterSection = ({ content }: BeforeAfterSectionProps) => {
  const defaultContent: BeforeAfterContent = {
    title: 'Extrimshot নেওয়ার আগে vs নিয়মিত ব্যবহারের কিছুদিন পরে*',
    before: {
      title: 'আগে',
      items: ['২ মিনিটেই আউট', 'কাজে ফোকাস থাকে না', 'সব কাজে অন্যমনস্কতা', 'বিশেষ মুহূর্তে দুর্বল']
    },
    after: {
      title: 'নিয়মিত ব্যবহারের পরে*',
      items: ['দিনে বেশিক্ষণ এনার্জেটিক ফিল', 'কাজে ফোকাস ও মোটিভেশন বাড়ে', 'হালকা ফিলিং, স্ট্রেস কমে', '৩০ মিনিট এক টানা সহবাস করতে পারবেন']
    }
  };

  const data = content || defaultContent;

  return (
    <section className="py-10 md:py-16 px-4 bg-gradient-to-b from-card/30 to-background">
      <div className="container max-w-4xl">
        {/* Header - Compact */}
        <div className="text-center mb-6 md:mb-10">
          <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full mb-2">
            ✨ রূপান্তর
          </span>
          <h2 className="text-lg md:text-3xl font-bold text-foreground mb-1 md:mb-2 leading-tight">
            আগে vs পরে
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            {data.title}
          </p>
        </div>

        {/* Before/After Cards - Side by side on all screens */}
        <div className="grid grid-cols-2 gap-2 md:gap-6 relative">
          {/* Center Arrow */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary to-teal-dark flex items-center justify-center shadow-lg border-2 border-background">
              <ArrowRight className="w-4 h-4 md:w-6 md:h-6 text-white" />
            </div>
          </div>

          {/* Before Card */}
          <div className="bg-gradient-to-br from-red/5 to-red/10 border border-red/20 rounded-xl md:rounded-2xl p-3 md:p-6 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-5">
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-red to-rose-600 flex items-center justify-center shadow-md">
                <Frown className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm md:text-xl font-bold text-foreground">{data.before.title}</h3>
                <p className="text-[9px] md:text-xs text-red">সমস্যা</p>
              </div>
            </div>
            
            {/* Items */}
            <div className="space-y-1.5 md:space-y-3">
              {data.before.items.map((item, i) => (
                <div key={i} className="flex items-start gap-1.5 md:gap-3 bg-background/60 backdrop-blur-sm rounded-lg p-1.5 md:p-3 border border-red/10">
                  <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-red/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-red" />
                  </div>
                  <span className="text-[10px] md:text-sm text-foreground leading-tight">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* After Card */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl md:rounded-2xl p-3 md:p-6 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-5">
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-primary to-teal-dark flex items-center justify-center shadow-md">
                <Smile className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm md:text-xl font-bold text-foreground">পরে</h3>
                <p className="text-[9px] md:text-xs text-primary">ফলাফল</p>
              </div>
            </div>
            
            {/* Items */}
            <div className="space-y-1.5 md:space-y-3">
              {data.after.items.map((item, i) => (
                <div key={i} className="flex items-start gap-1.5 md:gap-3 bg-background/60 backdrop-blur-sm rounded-lg p-1.5 md:p-3 border border-primary/10">
                  <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-primary" />
                  </div>
                  <span className="text-[10px] md:text-sm text-foreground leading-tight">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-[9px] md:text-xs text-muted-foreground mt-4 md:mt-6">
          *ফলাফল ব্যক্তিভেদে ভিন্ন হতে পারে
        </p>
      </div>
    </section>
  );
};
