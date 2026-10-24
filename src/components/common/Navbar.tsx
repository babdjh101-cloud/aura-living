import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Search, Menu, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';

interface NavbarProps {
  onSearchClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearchClick }) => {
  const { itemCount, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: 'All Products', href: '/products' },
    { label: 'Categories', href: '/categories' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  const isActive = (path: string) => {
    if (path === '/products' && location.pathname === '/products') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-stone-200/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-18">
          {/* Zone 1: Single text element wordmark */}
          <Link
            to="/"
            className="text-xl font-bold tracking-tight text-stone-900 whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
          >
            AURA LIVING
          </Link>

          {/* Zone 2: 4–5 clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-600">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 ${
                  isActive(link.href)
                    ? 'text-stone-900 font-semibold border-b border-stone-900'
                    : 'hover:text-stone-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Zone 3: 1 primary action / utility block */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Search button */}
            <Link
              to="/products"
              onClick={onSearchClick}
              className="p-2 text-stone-600 hover:text-stone-900 transition-colors rounded-full hover:bg-stone-100/80"
              aria-label="Search collection"
            >
              <Search className="w-5 h-5" />
            </Link>

            {/* Shopping Bag CTA */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
              aria-label={`Open shopping cart with ${itemCount} items`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Bag</span>
              <span className="font-mono tabular-nums text-xs bg-stone-700/80 px-1.5 py-0.5 rounded text-white">
                {itemCount}
              </span>
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-stone-700 hover:text-stone-900 rounded-lg"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FAF9F6] border-b border-stone-200 px-4 pt-3 pb-6 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block py-2 text-base font-medium transition-colors ${
                isActive(link.href) ? 'text-stone-900 font-semibold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-stone-200">
            <Link
              to="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2 text-base font-medium text-stone-900"
            >
              <span>Shopping Bag</span>
              <span className="font-mono tabular-nums text-sm text-stone-500">{itemCount} items</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
