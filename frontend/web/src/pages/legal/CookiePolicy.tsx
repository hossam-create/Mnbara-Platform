export default function CookiePolicy() {
    return (
      <div className="prose prose-blue max-w-none">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Cookie Policy</h1>
          <p className="text-gray-500 text-sm mb-8">Technical Data Usage</p>
  
          <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">1. What are cookies?</h2>
              <p>
                  Cookies are small text files placed on your device to help the site provide a better user experience. In general, cookies are used to retain user preferences and store information for things like shopping carts.
              </p>
          </section>
  
          <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">2. Types of cookies we use</h2>
              <ul className="list-disc pl-5 mt-4 space-y-2 text-gray-600">
                  <li><strong>Essential Cookies:</strong> Necessary for the website to function (e.g., logging in).</li>
                  <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with the website (e.g., Google Analytics).</li>
                  <li><strong>Functionality Cookies:</strong> Remember choices you make (e.g., your language preference).</li>
              </ul>
          </section>
      </div>
    );
  }
