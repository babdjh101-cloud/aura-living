import React, { useState } from 'react';
import { X } from 'lucide-react';

export const PromoBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-stone-900 text-stone-300 text-xs py-2 px-4 border-b border-stone-800 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex-1 text-center font-normal tracking-wide">
          <span>Complimentary white-glove courier delivery on all orders over $150</span>
          <span className="hidden sm:inline text-stone-500 mx-2" aria-hidden="true">·</span>
          <span className="hidden sm:inline text-stone-400">Cash on Delivery available nationwide</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:text-white transition-colors text-stone-400 focus:outline-none"
          aria-label="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
