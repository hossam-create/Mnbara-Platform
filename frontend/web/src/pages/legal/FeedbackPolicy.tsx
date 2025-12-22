export default function FeedbackPolicy() {
    return (
      <div className="prose prose-blue max-w-none">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Feedback & Reputation Policy</h1>
          <p className="text-gray-500 text-sm mb-8">Fairness First</p>
  
          <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">1. Honest Reviews</h2>
              <p>
                  Reviews must be based on actual experiences. You cannot leave feedback for a transaction that did not occur.
              </p>
          </section>
  
          <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">2. Feedback Manipulation</h2>
              <p>
                  Any attempt to manipulate feedback (e.g., creating fake accounts to rate yourself, or threatening a user with negative feedback to get a discount) is strictly prohibited and will result in a permanent ban.
              </p>
          </section>

          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 text-sm text-red-800">
              <strong>Extortion Policy:</strong> Users are not allowed to demand goods or services not included in the original agreement by threatening negative feedback.
          </div>
      </div>
    );
  }
