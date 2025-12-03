import { Check, X, AlertTriangle } from 'lucide-react';

export const TargetAudienceSection = () => {
  const audiences = [
    'যারা দিনে অনেক কাজ করেন, কিন্তু দ্রুত ক্লান্ত হয়ে যান',
    'যারা গেম, জিম বা ফিজিক্যাল অ্যাকটিভিটিতে কনসিস্টেন্ট এনার্জি চান',
    'যারা অতিরিক্ত স্ট্রেস, টেনশনে ভোগেন',
    'যারা বিশেষ মুহূর্তে বেশি কনফিডেন্ট হতে চান',
  ];

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-card/50 to-background">
      <div className="container">
        <h2 className="text-2xl md:text-4xl font-bold text-center mb-10">
          কার জন্য <span className="text-gradient">Nobosokti</span>?
        </h2>

        <div className="max-w-2xl mx-auto space-y-4 mb-8">
          {audiences.map((item, i) => (
            <div key={i} className="flex items-start gap-3 bg-card/80 rounded-xl p-4 border border-border">
              <Check className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
              <p className="text-foreground">{item}</p>
            </div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto bg-red/10 border border-red/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            <span className="text-red font-semibold">সতর্কতা:</span> ডায়াবেটিস/হার্ট/সিরিয়াস রোগী হলে অবশ্যই ডাক্তারকে জিজ্ঞেস করে ব্যবহার করবেন।
          </p>
        </div>
      </div>
    </section>
  );
};
