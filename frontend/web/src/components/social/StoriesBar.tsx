import { useState } from 'react';

const stories = [
  { id: 1, name: 'Ahmed', location: 'London', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed', viewed: false },
  { id: 2, name: 'Sarah', location: 'Paris', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', viewed: false },
  { id: 3, name: 'Mike', location: 'NY', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike', viewed: true },
  { id: 4, name: 'Lina', location: 'Dubai', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lina', viewed: false },
  { id: 5, name: 'John', location: 'Tokyo', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John', viewed: false },
  { id: 6, name: 'Emma', location: 'Berlin', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma', viewed: true },
];

export function StoriesBar() {
  const [activeStory, setActiveStory] = useState<number | null>(null);

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-4 overflow-x-auto">
      <div className="max-w-7xl mx-auto px-4 flex gap-4">
        {/* Your Story Action */}
        <div className="flex flex-col items-center gap-2 cursor-pointer group min-w-[72px]">
            <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-gray-200 dark:border-gray-600 p-1 group-hover:border-pink-500 transition-colors">
                    <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                </div>
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-pink-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">+</div>
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Add Story</span>
        </div>

        {/* Stories List */}
        {stories.map((story) => (
            <div key={story.id} className="flex flex-col items-center gap-2 cursor-pointer min-w-[72px]" onClick={() => setActiveStory(story.id)}>
                <div className={`w-16 h-16 rounded-full p-[2px] ${story.viewed ? 'bg-gray-300 dark:bg-gray-600' : 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600'} hover:scale-105 transition-transform`}>
                    <div className="w-full h-full bg-white dark:bg-gray-800 rounded-full p-[2px]">
                        <img src={story.img} alt={story.name} className="w-full h-full rounded-full object-cover" />
                    </div>
                </div>
                <div className="text-center">
                    <span className="text-xs font-medium text-gray-800 dark:text-gray-200 block leading-tight">{story.name}</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">{story.location}</span>
                </div>
            </div>
        ))}
      </div>

      {/* Story Viewer Modal (Mock) */}
      {activeStory && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setActiveStory(null)}>
            <div className="max-w-md w-full aspect-[9/16] bg-gray-800 rounded-2xl relative overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent flex justify-between items-center z-10">
                    <div className="flex items-center gap-2 text-white">
                        <img src={stories.find(s => s.id === activeStory)?.img} className="w-8 h-8 rounded-full border border-white" />
                        <span className="font-bold text-sm">{stories.find(s => s.id === activeStory)?.name}</span>
                        <span className="text-xs opacity-70">• 2h</span>
                    </div>
                    <button onClick={() => setActiveStory(null)} className="text-white hover:text-pink-500">✕</button>
                </div>
                
                {/* Content - Simulated Video */}
                <div className="w-full h-full bg-gray-700 flex items-center justify-center text-white relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-600/20"></div>
                    <div className="text-center">
                        <div className="text-6xl mb-4">🎥</div>
                        <p className="font-bold">Shopping at Apple Store {stories.find(s => s.id === activeStory)?.location}</p>
                        <p className="text-sm opacity-70 mt-2">Checking out iPhone 15 prices...</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                     <div className="flex gap-2">
                         <input type="text" placeholder="Send message..." className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-white placeholder-white/50 text-sm focus:outline-none focus:border-pink-500" />
                         <button className="p-2 text-2xl hover:scale-110 transition-transform">❤️</button>
                         <button className="p-2 text-2xl hover:scale-110 transition-transform">✈️</button>
                     </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

export default StoriesBar;
