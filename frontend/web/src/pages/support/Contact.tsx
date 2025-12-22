import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Logic to send to backend would go here
  };

  if (submitted) {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
              <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md text-center">
                  <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">✅</div>
                  <h2 className="text-2xl font-bold mb-2">Message Received!</h2>
                  <p className="text-gray-500 mb-8">Our support team will get back to you within 24 hours.</p>
                  <Link to="/" className="btn-primary w-full block py-3">Return Home</Link>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-gray-900">Contact Support</h1>
              <p className="text-gray-500 mt-2">We are here to help. Please fill out the form below.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                          <input type="text" required className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all" />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                          <input type="text" required className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all" />
                      </div>
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input type="email" required className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all" />
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                      <select className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all">
                          <option>General Inquiry</option>
                          <option>Order Issue</option>
                          <option>Payment & Billing</option>
                          <option>Trust & Safety</option>
                          <option>Report a Bug</option>
                      </select>
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                      <textarea rows={5} required className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"></textarea>
                  </div>

                  <button type="submit" className="w-full btn-primary py-3 text-lg font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
                      Send Message
                  </button>
              </form>
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
              Or email us directly at <a href="mailto:support@mnbarh.com" className="text-pink-600 font-bold hover:underline">support@mnbarh.com</a>
              <br/>
              Have an idea or suggestion? <Link to="/feedback" className="text-indigo-600 font-bold hover:underline">Visit the Feedback Hub</Link>
          </div>
      </div>
    </div>
  );
}
