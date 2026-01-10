import React from 'react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
  return (
    <Link
      to={`/product/${product.id}`}
      data-testid={`product-card-${product.id}`}
      className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-border/50"
    >
      <div className="aspect-square overflow-hidden">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-medium text-accent mb-2">{product.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-primary">Rp {product.price.toLocaleString('id-ID')}</span>
          <button
            data-testid={`view-product-${product.id}`}
            className="text-sm text-accent hover:text-primary transition-colors"
          >
            View Details →
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
