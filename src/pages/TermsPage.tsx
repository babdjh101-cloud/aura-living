import React from 'react';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <div className="mb-10 pb-6 border-b border-stone-200">
        <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold block mb-1">
          Store Terms
        </span>
        <h1 className="text-3xl font-serif font-normal text-stone-900">
          Terms & Conditions
        </h1>
        <p className="text-xs text-stone-500 mt-1">Effective Date: October 2026</p>
      </div>

      <div className="prose prose-stone max-w-none text-sm text-stone-600 space-y-6 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-stone-900">1. Acceptance of Terms</h2>
          <p>
            By accessing AURA Living and placing an order, you agree to comply with and be bound by the following terms governing catalog availability, pricing integrity, and courier delivery.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-stone-900">2. Natural Material Tolerances</h2>
          <p>
            Because each table, vessel, and chair is crafted from raw travertine stone, solid timber, and hand-thrown ceramic clay, slight natural variations in grain, veining, pinholes, and color are inherent to the craftsmanship and do not constitute manufacturing flaws.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-stone-900">3. Cash on Delivery (COD) Protocol</h2>
          <p>
            Orders confirmed with Cash on Delivery require the recipient to provide the exact cash or verified certified draft upon delivery courier arrival. Couriers reserve the right to withhold delivery if verification cannot be completed.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-stone-900">4. Inventory Verification</h2>
          <p>
            Prices and stock numbers are authoritative in our database. In the rare event of inventory exhaustion during simultaneous purchases, our studio will contact the customer within 24 hours to arrange an expedited artisan remake or clean cancellation.
          </p>
        </section>
      </div>
    </div>
  );
};
