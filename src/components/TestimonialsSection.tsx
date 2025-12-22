import { Star, Quote } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { useRef } from 'react';

const testimonials = [
  {
    quote: 'অফিসের কাজ শেষ করে বাসায় ফিরেই আগের মত ক্লান্ত হয়ে যেতাম। এখন Extrimshot নেওয়ার পর নিজেকে অনেক বেশি এনার্জেটিক ফিল করি।',
    name: 'শফিকুল',
    location: 'ঢাকা'
  },
  {
    quote: 'বয়স একটু বেশি হলেও এখনো কনফিডেন্স ধরে রাখতে পারছি, Extrimshot আমার লাইফস্টাইল চেইঞ্জ করে দিয়েছে।',
    name: 'কামাল',
    location: 'চট্টগ্রাম'
  },
  {
    quote: 'জিমের আগে একটা শট নিলে এনার্জি অনেক বেশি পাই, ওয়ার্কআউট সহজ মনে হয়।',
    name: 'সাগর',
    location: 'নারায়ণগঞ্জ'
  },
  {
    quote: 'প্রথমে বিশ্বাস করিনি, কিন্তু ২ সপ্তাহ ব্যবহারের পর নিজেই ফারাক বুঝতে পারছি। সকালে উঠতে আর কষ্ট হয় না।',
    name: 'রাশেদ',
    location: 'সিলেট'
  },
  {
    quote: 'বউ বলে এখন আমি আগের চেয়ে অনেক ফ্রেশ থাকি। ধন্যবাদ Extrimshot টিমকে।',
    name: 'জাহিদ',
    location: 'রাজশাহী'
  },
  {
    quote: 'দোকানে সারাদিন দাঁড়িয়ে থাকতে হয়, আগে রাতে পা ব্যথা করত। এখন অনেকটা ভালো, শরীরে একটা শক্তি অনুভব করি।',
    name: 'মিলন',
    location: 'খুলনা'
  },
  {
    quote: '৪০ বছর বয়সেও ২৫ এর মত ফিল করি! বন্ধুরা জিজ্ঞেস করে কী খাই।',
    name: 'আরিফ',
    location: 'গাজীপুর'
  },
  {
    quote: 'অনেক প্রোডাক্ট ট্রাই করেছি, কিন্তু এটাই একমাত্র যেটা কাজ করেছে। পার্শ্বপ্রতিক্রিয়া নেই।',
    name: 'হাসান',
    location: 'কুমিল্লা'
  }
];

export const TestimonialsSection = () => {
  const plugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: false })
  );

  return (
    <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-card to-background">
      <div className="container">
        <div className="text-center mb-12">
          <div className="section-divider" />
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
            কাস্টমারদের মতামত
          </h2>
          <p className="text-muted-foreground">
            বাস্তব অভিজ্ঞতা, বাস্তব ফলাফল
          </p>
        </div>

        <Carousel
          plugins={[plugin.current]}
          className="max-w-5xl mx-auto"
          opts={{
            align: 'start',
            loop: true,
          }}
        >
          <CarouselContent className="-ml-4">
            {testimonials.map((item, i) => (
              <CarouselItem key={i} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <div className="bg-background rounded-2xl p-6 h-full border border-border shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-accent text-accent" />
                      ))}
                    </div>
                    <Quote className="w-8 h-8 text-primary/20" />
                  </div>
                  <p className="text-foreground mb-6 leading-relaxed">"{item.quote}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-bold">{item.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.location}</p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <div className="text-center mt-12">
          <a href="#order" className="btn-primary inline-block">
            এখনি অর্ডার করুন
          </a>
        </div>
      </div>
    </section>
  );
};