import React from 'react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
  return (
    <Link
      to={`/product/${product.id}`}
      data-testid={`product-card-${product.id}`}
      className="group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-sky-100 hover:border-sky-300"
    >
      <div className="aspect-square overflow-hidden relative">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4 bg-gradient-to-b from-white to-sky-50/50">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
        <p className="text-xs md:text-sm text-gray-600 line-clamp-2 mb-3">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-lg md:text-xl font-bold text-sky-600">
            Rp {product.price.toLocaleString('id-ID')}
          </span>
          <button
            data-testid={`view-product-${product.id}`}
            className="text-xs md:text-sm text-sky-500 hover:text-blue-600 transition-colors font-semibold"
          >
            View Details →
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
