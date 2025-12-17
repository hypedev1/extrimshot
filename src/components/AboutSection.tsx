interface AboutContent {
  title: string;
  image: string;
  description: string;
  tags: string[];
  additionalInfo: string;
}

interface AboutSectionProps {
  content?: AboutContent;
}

export const AboutSection = ({ content }: AboutSectionProps) => {
  const defaultContent: AboutContent = {
    title: 'Extrimshot ন্যাচারাল পাওয়ার বুস্টার',
    image: '/lovable-uploads/12a04d91-3d2a-4274-8e85-16c00eae429a.png',
    description: 'Extrimshot হলো একটি প্রাকৃতিক হার্বাল পাওয়ার বুস্টার শট।',
    tags: ['১০০% হার্বাল', 'স্টেরয়েড ফ্রি', 'নন-অ্যাডিক্টিভ'],
    additionalInfo: 'রিসার্চড ডোজে ব্যবহার করা উপাদানের জন্য এটি সেফভাবে কাজ করার জন্য তৈরি করা হয়েছে।'
  };

  const data = content || defaultContent;

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-card/50">
      <div className="container">
        <h2 className="text-2xl md:text-4xl font-bold text-center mb-10">
          {data.title}
        </h2>

        <div className="flex flex-col lg:flex-row items-center gap-10">
          <div className="flex-1">
            <img 
              alt="Product Image" 
              className="rounded-2xl shadow-xl w-full max-w-md mx-auto" 
              src={data.image} 
            />
          </div>
          <div className="flex-1 space-y-6">
            <p className="text-lg text-muted-foreground">
              {data.description}
            </p>

            <div className="flex flex-wrap gap-3">
              {data.tags.map((item, i) => (
                <span key={i} className="flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-4 py-2 text-sm font-medium">
                  {item}
                </span>
              ))}
            </div>

            <p className="text-muted-foreground">
              {data.additionalInfo}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
