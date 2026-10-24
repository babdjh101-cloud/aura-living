import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, Hammer, Sparkles, Feather } from 'lucide-react';
import { heroImg } from '../services/mockData';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-20">
      {/* Intro Hero */}
      <div className="max-w-3xl space-y-6">
        <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold block">
          Studio Manifesto
        </span>
        <h1 className="text-3xl sm:text-5xl font-serif font-normal text-stone-900 tracking-tight leading-[1.15]">
          Furniture and objects designed for architectural calm and tactile presence.
        </h1>
        <p className="text-base sm:text-lg text-stone-600 leading-relaxed font-normal">
          Founded in 2024, AURA Living explores the intersection of brutalist architectural purity and Scandinavian domestic warmth. We collaborate with independent quarries in Tivoli and generational wood-turners in Småland to produce pieces that age gracefully over decades.
        </p>
      </div>

      {/* Visual Break */}
      <div className="aspect-16/9 rounded-2xl overflow-hidden border border-stone-200/80 shadow-xs">
        <img
          src={heroImg}
          alt="AURA studio showroom interior"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Core Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="space-y-3">
          <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-stone-800">
            <Hammer className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-stone-900">Uncompromising Materiality</h3>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            We use zero synthetic laminates or veneers. Every piece is constructed from monolithic stone slabs, FSC-certified solid European oaks, and coarse organic stoneware clays.
          </p>
        </div>

        <div className="space-y-3">
          <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-stone-800">
            <Feather className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-stone-900">Small-Batch Production</h3>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            We avoid mass warehouse stockpiling. Editions are limited to seasonal runs of 20 to 50 numbered pieces to ensure total quality control and artisan oversight.
          </p>
        </div>

        <div className="space-y-3">
          <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-stone-800">
            <Compass className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-stone-900">Direct Courier Fulfillment</h3>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Every shipment travels through verified freight specialists. With Cash on Delivery, our patrons inspect each piece at their home before parting with any money.
          </p>
        </div>
      </div>

      {/* Call to action */}
      <div className="pt-8 border-t border-stone-200 flex items-center justify-between">
        <div>
          <h4 className="text-base font-semibold text-stone-900">Ready to explore our work?</h4>
          <p className="text-xs text-stone-500 mt-0.5">Explore our current release of architectural armchairs and tables.</p>
        </div>
        <Link
          to="/products"
          className="px-5 py-2.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors flex items-center gap-2"
        >
          <span>View Catalog</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
