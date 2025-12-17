import { useState } from 'react';
import { products, categories } from '@/data/products';
import { ProductCard } from './ProductCard';
import { Button } from '@/components/ui/button';

export const ProductsSection = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category.toLowerCase().includes(activeCategory));

  return (
    <section className="py-16 md:py-24">
      <div className="container">
        {/* Section header */}
        <div className="text-center mb-12">
          <span className="text-accent font-medium text-sm uppercase tracking-wider">
            আমাদের পণ্যসমূহ
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
            প্রিমিয়াম অর্গানিক <span className="text-gradient">কালেকশন</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            বাংলাদেশের সেরা অর্গানিক পণ্যের সমাহার। সম্পূর্ণ প্রাকৃতিক, কেমিক্যাল মুক্ত এবং স্বাস্থ্যকর।
          </p>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? 'default' : 'outline'}
              className={`rounded-full px-6 transition-all ${
                activeCategory === category.id 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
                  : 'hover:border-primary hover:text-primary'
              }`}
              onClick={() => setActiveCategory(category.id)}
            >
              <span className="mr-2">{category.icon}</span>
              {category.nameBn}
            </Button>
          ))}
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {filteredProducts.map((product, index) => (
            <div
              key={product.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* View all button */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg" className="rounded-full px-8 border-2 hover:bg-primary hover:text-primary-foreground">
            সকল পণ্য দেখুন
          </Button>
        </div>
      </div>
    </section>
  );
};
