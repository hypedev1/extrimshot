import { Star } from 'lucide-react';
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
    <section className="py-16 px-4">
      <div className="container">
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
                <div className="card-glass p-6 h-full">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{item.quote}"</p>
                  <p className="font-semibold">
                    — {item.name}, <span className="text-muted-foreground font-normal">{item.location}</span>
                  </p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <div className="text-center mt-10">
          <a href="#order" className="btn-primary inline-block">
            ​এখনি অর্ডার করুন
          </a>
        </div>
      </div>
    </section>
  );
};
