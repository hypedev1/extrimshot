import { Check } from 'lucide-react';

export const AboutSection = () => {
  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-card/50">
      <div className="container">
        <h2 className="text-2xl md:text-4xl font-bold text-center mb-10">
          <span className="text-gradient">Nobosokti</span> – নেচারাল পাওয়ার বুস্টার
        </h2>

        <div className="flex flex-col lg:flex-row items-center gap-10">
          <div className="flex-1">
            <img 
              src="https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=500&h=400&fit=crop" 
              alt="Natural Ingredients"
              className="rounded-2xl shadow-xl w-full max-w-md mx-auto"
            />
          </div>
          <div className="flex-1 space-y-6">
            <p className="text-lg text-muted-foreground">
              <span className="text-primary font-semibold">Nobosokti</span> হলো একটি প্রাকৃতিক হার্বাল পাওয়ার বুস্টার শট, যা সিলেক্টেড হার্ব, ভিটামিন ও ন্যাচারাল এনার্জি কমপ্লেক্স দিয়ে তৈরি। এটি শরীরের ন্যাচারাল এনার্জি সিস্টেমকে সাপোর্ট করে।
            </p>

            <div className="flex flex-wrap gap-3">
              {['১০০% হার্বাল', 'স্টেরয়েড ফ্রি', 'নন-অ্যাডিক্টিভ'].map((item, i) => (
                <span key={i} className="flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-4 py-2">
                  <Check className="w-4 h-4 text-accent" />
                  <span className="font-medium">{item}</span>
                </span>
              ))}
            </div>

            <p className="text-muted-foreground">
              রিসার্চড ডোজে ব্যবহার করা উপাদানের জন্য এটি (Addiction) তৈরি না করে সেফভাবে কাজ করার জন্য তৈরি করা হয়েছে।
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
