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
    <section className="py-16 md:py-24 px-4 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <div className="section-divider" />
          <span className="inline-block text-primary font-semibold text-sm mb-3 bg-primary/10 px-4 py-1 rounded-full">
            রূপান্তরের গল্প
          </span>
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
            {data.title}
          </h2>
          <p className="text-muted-foreground">
            হাজার হাজার মানুষ ইতিমধ্যে তাদের জীবনে পরিবর্তন অনুভব করছেন
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-stretch gap-6 max-w-4xl mx-auto">
          {/* Before */}
          <div className="flex-1 bg-red/5 border-2 border-red/20 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-red/10 rounded-2xl flex items-center justify-center">
                  <Frown className="w-8 h-8 text-red" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">{data.before.title}</h3>
                  <p className="text-sm text-muted-foreground">সমস্যাগুলো</p>
                </div>
              </div>
              <div className="space-y-4">
                {data.before.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 bg-background/50 rounded-xl p-4">
                    <div className="w-8 h-8 rounded-full bg-red/10 flex items-center justify-center flex-shrink-0">
                      <X className="w-4 h-4 text-red" />
                    </div>
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex items-center justify-center px-4">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg">
              <ArrowRight className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>

          {/* Mobile Arrow */}
          <div className="flex md:hidden items-center justify-center py-2">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg rotate-90">
              <ArrowRight className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>

          {/* After */}
          <div className="flex-1 bg-primary/5 border-2 border-primary/20 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Smile className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">{data.after.title}</h3>
                  <p className="text-sm text-muted-foreground">ফলাফল</p>
                </div>
              </div>
              <div className="space-y-4">
                {data.after.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 bg-background/50 rounded-xl p-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};