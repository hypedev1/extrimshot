import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/data/products';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <Link to={`/${product.slug}`} className="group">
      <div className="card-glass overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/10">
        {/* Image container */}
        <div className="relative aspect-square overflow-hidden bg-secondary/30">
          <img
            src={product.image}
            alt={product.nameBn}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          
          {/* Discount badge */}
          <div className="absolute top-3 left-3">
            <Badge className="bg-destructive text-destructive-foreground font-bold px-3 py-1">
              -{product.discount}%
            </Badge>
          </div>

          {/* Special badge */}
          {product.badgeBn && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-primary text-primary-foreground font-bold px-3 py-1">
                {product.badgeBn}
              </Badge>
            </div>
          )}

          {/* Quick actions overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
            <div className="flex gap-2">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                <ShoppingCart className="w-4 h-4 mr-1" />
                অর্ডার
              </Button>
              <Button size="sm" variant="secondary">
                <Eye className="w-4 h-4 mr-1" />
                বিস্তারিত
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          {/* Category */}
          <p className="text-xs text-accent font-medium uppercase tracking-wider">
            {product.categoryBn}
          </p>

          {/* Title */}
          <h3 className="text-lg font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {product.nameBn}
          </h3>

          {/* Tagline */}
          <p className="text-sm text-muted-foreground line-clamp-1">
            {product.taglineBn}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < Math.floor(product.rating)
                      ? 'fill-primary text-primary'
                      : 'fill-muted text-muted'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              ({product.reviews.toLocaleString('bn-BD')})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3 pt-2">
            <span className="text-2xl font-bold text-primary">
              ৳{product.price.toLocaleString('bn-BD')}
            </span>
            <span className="text-sm text-muted-foreground line-through">
              ৳{product.originalPrice.toLocaleString('bn-BD')}
            </span>
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            {product.featuresBn.slice(0, 2).map((feature, i) => (
              <span
                key={i}
                className="text-xs bg-secondary/50 text-muted-foreground px-2 py-1 rounded-full"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
};
