export default function IdentityPolicy() {
    return (
      <div className="prose prose-blue max-w-none">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Identity & Verification</h1>
          <p className="text-gray-500 text-sm mb-8">Building a Trusted Community</p>
  
          <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">1. Why we verify ID?</h2>
              <p>
                  To ensure safety, we require Travelers to verify their identity before they can accept orders. This deters fraud and theft.
              </p>
          </section>
  
          <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">2. How it works</h2>
              <p>
                  We use third-party secure partners to scan your Government ID (Passport or Driver's License) and match it with a selfie.
              </p>
          </section>

          <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">3. Data Privacy</h2>
              <p>
                  Your ID document is <strong>encrypted</strong> and stored securely. Other users will only see a "Verified Badge" on your profile; they will never see your passport details.
              </p>
          </section>
      </div>
    );
  }
