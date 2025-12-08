import { X, Check, Frown, Flame, ArrowRight } from 'lucide-react';
export const BeforeAfterSection = () => {
  const beforeItems = ['সকালেই ক্লান্তি, সারাদিন এনার্জি কম', 'কাজে ফোকাস থাকে না', 'সব কাজে অন্যমনস্কতা', 'বিশেষ মুহূর্তে দুর্বল'];
  const afterItems = ['দিনে বেশিক্ষণ এনার্জেটিক ফিল', 'কাজে ফোকাস ও মোটিভেশন বাড়ে', 'হালকা ফিলিং, স্ট্রেস কমে', '৩০ মিনিট এক টানা সহবাস করতে পারবেন'];
  return <section className="py-16 px-4">
      <div className="container">
        <p className="text-center text-primary font-semibold mb-2">রূপান্তরের গল্প</p>
        <h2 className="text-2xl md:text-4xl font-bold text-center mb-4">
          <span className="text-gradient">Extrimshot </span> নেওয়ার আগে vs নিয়মিত ব্যবহারের কিছুদিন পরে*
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          হাজার হাজার পুরুষ ইতিমধ্যে তাদের জীবনে পরিবর্তন অনুভব করছেন
        </p>

        <div className="flex flex-col md:flex-row items-stretch gap-6 max-w-4xl mx-auto">
          {/* Before */}
          <div className="flex-1 bg-red/5 border border-red/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red/20 rounded-full flex items-center justify-center">
                <Frown className="w-6 h-6 text-red" />
              </div>
              <h3 className="text-xl font-bold">আগে</h3>
            </div>
            <div className="space-y-3">
              {beforeItems.map((item, i) => <div key={i} className="flex items-center gap-3">
                  <X className="w-4 h-4 text-red flex-shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </div>)}
            </div>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex items-center justify-center">
            <ArrowRight className="w-10 h-10 text-primary" />
          </div>

          {/* After */}
          <div className="flex-1 bg-accent/5 border border-accent/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Flame className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">নিয়মিত ব্যবহারের পরে*</h3>
            </div>
            <div className="space-y-3">
              {afterItems.map((item, i) => <div key={i} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-accent flex-shrink-0" />
                  <span className="text-foreground">{item}</span>
                </div>)}
            </div>
          </div>
        </div>
      </div>
    </section>;
};