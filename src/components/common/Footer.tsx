import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-stone-950 text-stone-300 pt-16 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-stone-800">
          {/* Brand Philosophy */}
          <div className="md:col-span-1 space-y-4">
            <span className="text-lg font-bold tracking-tight text-white block">AURA LIVING</span>
            <p className="text-sm text-stone-400 leading-relaxed">
              Curated architectural objects, sculptural furniture, and tactile homewares celebrating raw natural materiality and deliberate simplicity.
            </p>
          </div>

          {/* Catalog */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-stone-400 font-semibold mb-4">Storefront</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/products" className="hover:text-white transition-colors">
                  All Collections
                </Link>
              </li>
              <li>
                <Link to="/categories" className="hover:text-white transition-colors">
                  Product Categories
                </Link>
              </li>
              <li>
                <Link to="/products?filter=featured" className="hover:text-white transition-colors">
                  Featured Editions
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-white transition-colors">
                  Shopping Bag
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-stone-400 font-semibold mb-4">Customer Care</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About the Studio
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact & Inquiries
                </Link>
              </li>
              <li>
                <Link to="/returns" className="hover:text-white transition-colors">
                  Shipping & Returns
                </Link>
              </li>
              <li>
                <span className="text-stone-500 text-xs block pt-1">Cash on Delivery Available</span>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-stone-400 font-semibold mb-4">Legal & Policies</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/returns" className="hover:text-white transition-colors">
                  Refund & Return Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© {new Date().getFullYear()} AURA Living Studio. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Natural Materiality</span>
            <span aria-hidden="true">·</span>
            <span>Hand-finished Joinery</span>
            <span aria-hidden="true">·</span>
            <span>Direct Courier Delivery</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
