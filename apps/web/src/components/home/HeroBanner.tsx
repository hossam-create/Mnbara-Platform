import { Link } from 'react-router-dom';

/**
 * Hero Banner - Mnbara marketplace promotional banner
 * Dark background promotional banner with headline and CTA
 */

export default function HeroBanner() {
  return (
    <section className="bg-[#191919]">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="flex items-center min-h-[300px] py-8">
          {/* Left Content */}
          <div className="flex-1 max-w-lg">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Winter essentials
              <br />
              up to 60% off
            </h1>
            <p className="text-lg text-gray-300 mb-6">
              Top deals on winter gear, clothing, and more.
            </p>
            <Link
              to="/deals"
              className="inline-block bg-white text-gray-900 font-semibold px-8 py-3 rounded-full hover:bg-gray-100 transition-colors"
            >
              Shop now
            </Link>
          </div>

          {/* Right Image Area */}
          <div className="hidden md:block flex-1">
            <div className="relative h-[280px] flex items-center justify-end">
              <div className="w-[400px] h-[250px] bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1544923246-77307dd628b4?w=400&q=80" 
                  alt="Winter essentials"
                  className="w-full h-full object-cover opacity-90"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Secondary promotional banners (smaller, 2-column layout)
export function PromoBanner({ 
  title, 
  subtitle, 
  ctaText, 
  ctaLink, 
  bgColor = '#f5af02',
  textColor = 'white'
}: {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  bgColor?: string;
  textColor?: string;
}) {
  return (
    <div 
      className="rounded-lg p-6 flex items-center justify-between h-[120px]"
      style={{ backgroundColor: bgColor }}
    >
      <div>
        <h3 className="text-xl font-bold mb-1" style={{ color: textColor }}>{title}</h3>
        <p className="text-sm opacity-90" style={{ color: textColor }}>{subtitle}</p>
      </div>
      <Link 
        to={ctaLink}
        className="bg-white text-gray-900 font-medium px-5 py-2 rounded-full text-sm hover:bg-gray-100 transition-colors flex-shrink-0"
      >
        {ctaText}
      </Link>
    </div>
  );
}
