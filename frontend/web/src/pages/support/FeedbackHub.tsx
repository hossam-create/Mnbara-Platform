import { useState } from 'react';

export default function FeedbackHub() {
  const [activeTab, setActiveTab] = useState<'ideas' | 'complaints'>('ideas');
  
  // Mock Logic for Ideas
  const [ideas, setIdeas] = useState([
      { id: 1, text: 'Add Crypto Payments (USDT)', votes: 124, user: 'CryptoKing' },
      { id: 2, text: 'Verification badge for older accounts', votes: 89, user: 'Sarah99' },
      { id: 3, text: 'Dark Mode for mobile app', votes: 45, user: 'NightOwl' },
  ]);

  const handleVote = (id: number) => {
      setIdeas(prev => prev.map(idea => idea.id === id ? { ...idea, votes: idea.votes + 1 } : idea));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-gray-900">Community Feedback Hub</h1>
              <p className="text-gray-500 mt-2">Help us build the best crowdshipping platform in the world.</p>
          </div>

          <div className="flex justify-center mb-8">
              <div className="bg-white p-1 rounded-full shadow-sm border border-gray-200 flex">
                  <button 
                    onClick={() => setActiveTab('ideas')}
                    className={`px-8 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'ideas' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                      💡 Suggest Ideas
                  </button>
                  <button 
                    onClick={() => setActiveTab('complaints')}
                    className={`px-8 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'complaints' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                      📋 File Complaint
                  </button>
              </div>
          </div>

          {activeTab === 'ideas' ? (
              <div className="space-y-6 animate-fade-in">
                  
                  {/* Ideas List */}
                  <div className="grid gap-4">
                      {ideas.map((idea) => (
                          <div key={idea.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:border-indigo-200 transition-all">
                              <div>
                                  <h3 className="font-bold text-lg text-gray-900 mb-1">{idea.text}</h3>
                                  <div className="text-xs text-gray-400">Suggested by @{idea.user}</div>
                              </div>
                              <button 
                                onClick={() => handleVote(idea.id)}
                                className="flex flex-col items-center bg-gray-50 hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 p-3 rounded-xl transition-colors"
                              >
                                  <span className="text-xl">▲</span>
                                  <span className="font-bold text-sm">{idea.votes}</span>
                              </button>
                          </div>
                      ))}
                  </div>

                  {/* Add New Idea Box */}
                  <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 mt-8">
                      <h3 className="font-bold text-indigo-900 mb-4">Have an idea?</h3>
                      <div className="flex gap-4">
                          <input type="text" placeholder="e.g., Add a filter for..." className="flex-1 px-4 py-3 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          <button className="btn-primary px-8">Post</button>
                      </div>
                  </div>

              </div>
          ) : (
              <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-8 animate-fade-in max-w-2xl mx-auto">
                  <div className="flex items-center gap-3 mb-6 text-red-600">
                      <span className="text-2xl">⚠️</span>
                      <h2 className="text-xl font-bold">Official Complaint Form</h2>
                  </div>
                  <p className="text-gray-500 text-sm mb-6">
                      Complaints filed here are sent directly to the Senior Support Team. Response time: &lt; 12 hours.
                  </p>
                  
                  <form className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Complaint Type</label>
                          <select className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 outline-none">
                              <option>New Complaint</option>
                              <option>Follow up on existing ticket</option>
                              <option>Report Serious Misconduct</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                          <textarea rows={4} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 outline-none"></textarea>
                      </div>
                      <button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg shadow-lg transition-colors">
                          Submit Complaint
                      </button>
                  </form>
              </div>
          )}
      </div>
    </div>
  );
}
