import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-20 text-center">
      <div className="max-w-md mx-auto space-y-6">
        <span className="font-mono text-xs uppercase tracking-widest text-stone-400">
          Error 404
        </span>
        <h1 className="text-4xl sm:text-5xl font-serif font-normal text-stone-900 tracking-tight">
          Page Not Located
        </h1>
        <p className="text-sm text-stone-500 leading-relaxed">
          The requested page or collection link could not be found. It may have been relocated or updated in our catalog.
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors shadow-xs"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return Home</span>
          </Link>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>View All Pieces</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
