import { Star } from 'lucide-react';

const testimonials = [
  {
    quote: 'অফিসের কাজ শেষ করে বাসায় ফিরেই আগের মত ক্লান্ত হয়ে যেতাম। এখন Nobosokti নেওয়ার পর নিজেকে অনেক বেশি এনার্জেটিক ফিল করি।',
    name: 'শফিকুল',
    location: 'ঢাকা',
  },
  {
    quote: 'বয়স একটু বেশি হলেও এখনো কনফিডেন্স ধরে রাখতে পারছি, Nobosokti আমার লাইফস্টাইল চেইঞ্জ করে দিয়েছে।',
    name: 'কামাল',
    location: 'চট্টগ্রাম',
  },
  {
    quote: 'জিমের আগে একটা শট নিলে এনার্জি অনেক বেশি পাই, ওয়ার্কআউট সহজ মনে হয়।',
    name: 'সাগর',
    location: 'নারায়ণগঞ্জ',
  },
];

export const TestimonialsSection = () => {
  return (
    <section className="py-16 px-4">
      <div className="container">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((item, i) => (
            <div key={i} className="card-glass p-6">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4 italic">"{item.quote}"</p>
              <p className="font-semibold">— {item.name}, <span className="text-muted-foreground font-normal">{item.location}</span></p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a href="#order" className="btn-primary inline-block">
            আপনিও আজই এক্সপেরিয়েন্স করুন
          </a>
        </div>
      </div>
    </section>
  );
};
