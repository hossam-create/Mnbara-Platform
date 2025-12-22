import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      
      {/* Hero */}
      <section className="bg-black text-white py-24 px-4 relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-purple-900 opacity-50"></div>
         <div className="max-w-4xl mx-auto relative z-10 text-center">
             <h1 className="text-5xl md:text-7xl font-display font-black mb-6">
                 We shrink the world.
             </h1>
             <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto">
                 MnBarh isn't just a delivery app. It's a global community connecting people who want products with people who travel.
             </p>
         </div>
      </section>

      {/* Our Story */}
      <section className="py-20 px-4 max-w-3xl mx-auto text-lg leading-relaxed text-gray-600">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
          <p className="mb-6">
              It started with a simple problem: Ordering products from abroad was expensive, slow, and full of hidden customs fees. Meanwhile, millions of travelers were flying with empty luggage space.
          </p>
          <p className="mb-6">
              We asked: <strong>"What if we could connect them?"</strong>
          </p>
          <p>
              Today, MnBarh is the world's leading crowdshipping platform (Concept), enabling shoppers to get items from anywhere in days, not weeks, while travelers earn money to fund their adventures.
          </p>
      </section>

      {/* Stats/Credibility */}
      <section className="bg-gray-50 py-20 px-4">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                  { label: 'Community Members', value: '1.2M+' },
                  { label: 'Countries Served', value: '190' },
                  { label: 'Successful Deliveries', value: '500k' },
                  { label: 'Traveler Earnings', value: '$15M+' }
              ].map((stat, idx) => (
                  <div key={idx}>
                      <div className="text-4xl font-black text-indigo-600 mb-2">{stat.value}</div>
                      <div className="text-sm font-bold uppercase tracking-wider text-gray-400">{stat.label}</div>
                  </div>
              ))}
          </div>
      </section>

      {/* Team CTA */}
      <section className="py-24 text-center">
          <h2 className="text-3xl font-bold mb-8">Ready to join the revolution?</h2>
          <div className="flex justify-center gap-4">
              <Link to="/" className="btn-primary px-8 py-3">Start Shopping</Link>
              <Link to="/legal/traveler-rules" className="px-8 py-3 rounded-lg border-2 border-gray-200 font-bold hover:border-gray-900 transition-colors">Become a Traveler</Link>
          </div>
      </section>
      
      <footer className="py-8 text-center text-gray-400 text-xs border-t border-gray-100">
           &copy; 2025 MnBarh Inc. • <Link to="/" className="hover:underline">Home</Link>
      </footer>
    </div>
  );
}
