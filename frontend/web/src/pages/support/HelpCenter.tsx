import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would search across policies.
    // For now, we'll just redirect to the legal section logic or show a generic "not found"
    // But to keep it "Smart", let's redirect to Legal if they type "legal" or similar.
    navigate('/legal');
  };

  const categories = [
    { 
      title: 'Buying & Orders', 
      icon: '🛍️', 
      desc: 'Refunds, Shipping, and finding items', 
      link: '/legal/money-back' 
    },
    { 
      title: 'Traveling & Earnings', 
      icon: '✈️', 
      desc: 'Trip management, payouts, and customs', 
      link: '/legal/traveler-rules' 
    },
    { 
      title: 'Account & Safety', 
      icon: '🛡️', 
      desc: 'Login, Identity Verification, and Passwords', 
      link: '/legal/identity' 
    },
    { 
      title: 'Dispute Resolution', 
      icon: '⚖️', 
      desc: 'File a claim or report an issue', 
      link: '/dispute' 
    },
    { 
      title: 'Trust & Feedback', 
      icon: '⭐', 
      desc: 'How reputation works on MnBarh', 
      link: '/legal/feedback' 
    },
    { 
      title: 'Fees & Billings', 
      icon: '💳', 
      desc: 'Understanding service fees and costs', 
      link: '/legal/fees' 
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        {/* Hero Search Section */}
        <section className="bg-gradient-to-br from-indigo-900 via-gray-900 to-black text-white py-20 px-4">
            <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl font-bold font-display mb-6">How can we help you?</h1>
                <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
                    <input 
                        type="text" 
                        placeholder="Search for answers (e.g., 'refund', 'customs', 'identity')" 
                        className="w-full pl-6 pr-14 py-4 rounded-full text-gray-900 text-lg shadow-xl focus:outline-none focus:ring-4 focus:ring-pink-500/30 transition-shadow"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button type="submit" className="absolute right-3 top-2.5 p-2 bg-pink-500 rounded-full hover:bg-pink-600 transition-colors">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                </form>
            </div>
        </section>

        {/* Categories Grid */}
        <section className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-10">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categories.map((cat, idx) => (
                    <Link 
                        key={idx} 
                        to={cat.link}
                        className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all border border-gray-100 items-start flex gap-4 group"
                    >
                        <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center text-3xl group-hover:bg-blue-50 transition-colors">
                            {cat.icon}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{cat.title}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">{cat.desc}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </section>

        {/* Contact Strip */}
        <section className="bg-white border-t border-gray-200 py-12">
            <div className="max-w-7xl mx-auto px-4 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Still need help?</h2>
                <div className="flex justify-center gap-6">
                    <Link to="/contact" className="btn-primary text-sm px-6 py-3">
                        Contact Support
                    </Link>
                    <Link to="/about" className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-bold hover:border-gray-900 transition-colors">
                        About MnBarh
                    </Link>
                </div>
            </div>
        </section>
        
        {/* Simple Footer */}
        <footer className="py-8 text-center text-gray-400 text-xs">
           &copy; 2025 MnBarh Inc. • <Link to="/" className="hover:underline">Home</Link>
        </footer>
    </div>
  );
}
