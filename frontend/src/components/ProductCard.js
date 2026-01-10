import React from 'react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
  return (
    <Link
      to={`/product/${product.id}`}
      data-testid={`product-card-${product.id}`}
      className="group relative bg-gradient-to-br from-white to-yellow-50/30 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border-2 border-yellow-200/30 hover:border-green-300 hover:-translate-y-1"
    >
      {/* Festive Corner Decoration */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-400/20 to-yellow-400/20 rounded-bl-full"></div>
      
      <div className="aspect-square overflow-hidden relative">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {/* Sparkle overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-yellow-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>
      <div className="p-4">
        <h3 className="text-base md:text-lg font-semibold text-amber-900 mb-2">{product.name}</h3>
        <p className="text-xs md:text-sm text-gray-600 line-clamp-2 mb-3">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
            Rp {product.price.toLocaleString('id-ID')}
          </span>
          <button
            data-testid={`view-product-${product.id}`}
            className="text-xs md:text-sm text-amber-700 hover:text-green-600 transition-colors font-semibold"
          >
            View Details →
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
