import React from 'react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <div className="mb-10 pb-6 border-b border-stone-200">
        <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold block mb-1">
          Legal & Compliance
        </span>
        <h1 className="text-3xl font-serif font-normal text-stone-900">
          Privacy Policy
        </h1>
        <p className="text-xs text-stone-500 mt-1">Last revised: October 2026</p>
      </div>

      <div className="prose prose-stone max-w-none text-sm text-stone-600 space-y-6 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-stone-900">1. Information We Collect</h2>
          <p>
            When you browse AURA Living or place an order via our Cash on Delivery courier service, we collect necessary contact and logistics details including your full name, telephone number, shipping street address, and optional email address.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-stone-900">2. How Your Data Is Handled</h2>
          <p>
            Your information is used strictly to fulfill purchases, dispatch insured freight couriers, verify delivery addresses, and communicate order tracking updates. We do not sell, rent, or trade your personal data to third-party advertising brokers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-stone-900">3. Database Security & Row Level Security (RLS)</h2>
          <p>
            All production customer records are protected in a Supabase PostgreSQL instance enforced by strict Row Level Security policies. Public visitors cannot browse orders, customer contact directories, or administrative rosters.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-stone-900">4. Data Retention and Inquiries</h2>
          <p>
            Patrons may request deletion or verification of their order history at any time by contacting our data protection officer at <span className="font-mono text-stone-800">privacy@auraliving.com</span>.
          </p>
        </section>
      </div>
    </div>
  );
};
