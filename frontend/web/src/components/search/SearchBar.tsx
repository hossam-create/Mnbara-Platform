import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  initialValue?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  placeholder = 'Search for anything', 
  onSearch,
  initialValue = '',
}) => {
  const [query, setQuery] = useState(initialValue);
  const navigate = useNavigate();

  React.useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (onSearch) {
      onSearch(query);
    } else {
      // Default behavior: navigate to search results page
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full px-6 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
        />
        <button
          type="submit"
          className="absolute right-2 bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors"
        >
          Search
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2 mt-3 justify-center">
        <span className="text-xs text-gray-500">Popular: </span>
        {['iPhone', 'Sneakers', 'Laptop', 'Watch', 'Camera'].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setQuery(item)}
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
          >
            {item}
          </button>
        ))}
      </div>
    </form>
  );
};

export default SearchBar;