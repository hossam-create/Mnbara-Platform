import React from 'react';

const DesignSystem: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Design System</h1>
      
      {/* Colors */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Colors</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {/* Primary Colors */}
          <div>
            <div className="h-20 bg-[rgb(var(--color-primary))] rounded-lg mb-2 border"></div>
            <p className="text-sm font-medium text-gray-900">Primary</p>
            <p className="text-xs text-gray-600">rgb(var(--color-primary))</p>
          </div>
          
          <div>
            <div className="h-20 bg-[rgb(var(--color-primary-dark))] rounded-lg mb-2 border"></div>
            <p className="text-sm font-medium text-gray-900">Primary Dark</p>
            <p className="text-xs text-gray-600">rgb(var(--color-primary-dark))</p>
          </div>
          
          <div>
            <div className="h-20 bg-[rgb(var(--color-primary-light))] rounded-lg mb-2 border"></div>
            <p className="text-sm font-medium text-gray-900">Primary Light</p>
            <p className="text-xs text-gray-600">rgb(var(--color-primary-light))</p>
          </div>
          
          {/* Secondary Colors */}
          <div>
            <div className="h-20 bg-[rgb(var(--color-secondary))] rounded-lg mb-2 border"></div>
            <p className="text-sm font-medium text-gray-900">Secondary</p>
            <p className="text-xs text-gray-600">rgb(var(--color-secondary))</p>
          </div>
          
          <div>
            <div className="h-20 bg-[rgb(var(--color-secondary-dark))] rounded-lg mb-2 border"></div>
            <p className="text-sm font-medium text-gray-900">Secondary Dark</p>
            <p className="text-xs text-gray-600">rgb(var(--color-secondary-dark))</p>
          </div>
        </div>
        
        {/* Status Colors */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="h-16 bg-[rgb(var(--color-success))] rounded-lg mb-2 border"></div>
            <p className="text-sm font-medium text-gray-900">Success</p>
          </div>
          
          <div>
            <div className="h-16 bg-[rgb(var(--color-warning))] rounded-lg mb-2 border"></div>
            <p className="text-sm font-medium text-gray-900">Warning</p>
          </div>
          
          <div>
            <div className="h-16 bg-[rgb(var(--color-error))] rounded-lg mb-2 border"></div>
            <p className="text-sm font-medium text-gray-900">Error</p>
          </div>
        </div>
      </section>
      
      {/* Typography */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Typography</h2>
        
        <div className="space-y-4">
          <div>
            <h1 className="text-5xl font-bold text-gray-900 mb-2">Heading 1</h1>
            <p className="text-sm text-gray-600">5xl / Bold / --font-display</p>
          </div>
          
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Heading 2</h2>
            <p className="text-sm text-gray-600">4xl / Bold / --font-display</p>
          </div>
          
          <div>
            <h3 className="text-3xl font-semibold text-gray-900 mb-2">Heading 3</h3>
            <p className="text-sm text-gray-600">3xl / Semibold / --font-display</p>
          </div>
          
          <div>
            <p className="text-base text-gray-900 mb-2">Body Text</p>
            <p className="text-sm text-gray-600">Base / Normal / --font-sans</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-2">Small Text</p>
            <p className="text-xs text-gray-500">Sm / Normal / --font-sans</p>
          </div>
        </div>
      </section>
      
      {/* Buttons */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Buttons</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Primary Buttons</h3>
            
            <div className="space-y-3">
              <button className="bg-[rgb(var(--color-primary))] text-white px-4 py-2 rounded-lg hover:bg-[rgb(var(--color-primary-dark))] transition-colors">
                Primary Button
              </button>
              
              <button className="bg-[rgb(var(--color-secondary))] text-white px-4 py-2 rounded-lg hover:bg-[rgb(var(--color-secondary-dark))] transition-colors">
                Secondary Button
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Outline Buttons</h3>
            
            <div className="space-y-3">
              <button className="border border-[rgb(var(--color-primary))] text-[rgb(var(--color-primary))] px-4 py-2 rounded-lg hover:bg-[rgb(var(--color-primary-light))] transition-colors">
                Outline Primary
              </button>
              
              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                Outline Secondary
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Spacing */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Spacing</h2>
        
        <div className="space-y-4">
          {[4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96].map((space) => (
            <div key={space} className="flex items-center">
              <div 
                className="bg-blue-100 rounded" 
                style={{ width: `${space}px`, height: '24px' }}
              ></div>
              <span className="ml-3 text-sm text-gray-600">{space}px</span>
            </div>
          ))}
        </div>
      </section>
      
      {/* Border Radius */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Border Radius</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {['sm', 'md', 'lg', 'xl', '2xl', 'full'].map((radius) => (
            <div key={radius} className="text-center">
              <div 
                className="bg-blue-100 h-16 flex items-center justify-center mx-auto mb-2"
                style={{ 
                  borderRadius: radius === 'sm' ? '0.125rem' :
                             radius === 'md' ? '0.5rem' :
                             radius === 'lg' ? '0.75rem' :
                             radius === 'xl' ? '1rem' :
                             radius === '2xl' ? '1.5rem' : '9999px'
                }}
              ></div>
              <p className="text-sm font-medium text-gray-900">{radius}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default DesignSystem;