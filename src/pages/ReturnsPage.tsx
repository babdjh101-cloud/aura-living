import React from 'react';

export const ReturnsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <div className="mb-10 pb-6 border-b border-stone-200">
        <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold block mb-1">
          Guarantees & Logistics
        </span>
        <h1 className="text-3xl font-serif font-normal text-stone-900">
          Shipping, Returns & Refunds
        </h1>
        <p className="text-xs text-stone-500 mt-1">Updated for 2026</p>
      </div>

      <div className="prose prose-stone max-w-none text-sm text-stone-600 space-y-6 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-stone-900">1. White-Glove Shipping</h2>
          <p>
            Orders exceeding $150 receive complimentary insured white-glove transport. All other standard catalog orders carry a flat $15.00 freight coordination fee.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-stone-900">2. Arrival Inspection</h2>
          <p>
            With Cash on Delivery, patrons are invited to unpack and examine all surfaces (timber joinery, stone polish, ceramic glazes) in the presence of the courier before tendering payment.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-stone-900">3. 30-Day Return Policy</h2>
          <p>
            If a piece does not suit your space, notify our concierge within 30 days of delivery. The item must remain in pristine, unaltered condition with original protective crating.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-stone-900">4. Return Freight Arrangements</h2>
          <p>
            Our concierge will schedule a return freight pickup at your residence. Upon arrival and inspection at our Seattle studio, your refund will be remitted within 3 business days via bank transfer or original certified payment.
          </p>
        </section>
      </div>
    </div>
  );
};
