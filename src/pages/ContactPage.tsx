import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, CheckCircle2, Send } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Order & Shipping Inquiries',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setSubmitted(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <div className="max-w-2xl mb-12">
        <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold block mb-1">
          Client Services
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-normal text-stone-900 tracking-tight">
          Contact & Studio Inquiries
        </h1>
        <p className="text-sm text-stone-600 mt-2">
          Have questions regarding dimensions, bespoke finishes, courier delivery, or commercial projects? Our studio team responds within one business day.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Contact Form */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/80 shadow-xs">
          {submitted ? (
            <div className="py-12 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-semibold text-stone-900">Inquiry Received</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Thank you for reaching out, {formData.name}. A studio representative will reply to {formData.email} shortly.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', email: '', subject: 'Order & Shipping Inquiries', message: '' });
                }}
                className="mt-4 px-4 py-2 text-xs font-medium text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Your Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Helena Lindqvist"
                    className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="helena@example.com"
                    className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Inquiry Topic
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white transition-all"
                >
                  <option value="Order & Shipping Inquiries">Order & Courier Delivery Inquiries</option>
                  <option value="Product Specifications & Materials">Product Specifications & Materials</option>
                  <option value="Trade & Interior Architect Inquiries">Trade & Interior Architect Inquiries</option>
                  <option value="Returns & Exchanges">Returns & Exchanges</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Message Details <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about the project, piece, or order reference..."
                  className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-5 rounded-lg text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Inquiry</span>
              </button>
            </form>
          )}
        </div>

        {/* Studio Info Sidebar */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-stone-100/70 p-6 rounded-2xl border border-stone-200/80 space-y-4">
            <h3 className="text-sm font-semibold text-stone-900">Studio & Gallery</h3>
            <div className="space-y-3 text-xs text-stone-600">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-stone-800 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-stone-900">AURA Living Studio</p>
                  <p>1200 Westlake Ave N, Suite 400</p>
                  <p>Seattle, WA 98109, United States</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-stone-800 shrink-0" />
                <span>+1 (206) 555-0198</span>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-stone-800 shrink-0" />
                <span>concierge@auraliving.com</span>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-stone-200">
                <Clock className="w-4 h-4 text-stone-800 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-stone-900">Operating Hours</p>
                  <p>Monday – Friday: 09:00 – 18:00 PST</p>
                  <p>Saturday: By Appointment Only</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
