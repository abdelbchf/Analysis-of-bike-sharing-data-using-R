import React from 'react';
import { Link } from 'react-router-dom'; // Added import

function ResultsList({ results, loading, error }) {
  if (loading) {
    return <p className="text-center text-gray-500 mt-4">Loading results...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500 mt-4">Error: {error}</p>;
  }

  if (!results || results.length === 0) {
    return <p className="text-center text-gray-500 mt-4">No results found. Try a different search.</p>;
  }

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {results.map((item) => (
        <Link key={item.id} to={`/product/${item.id}`} className="block hover:shadow-2xl transition-shadow duration-300 ease-in-out">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
            {/* Placeholder for an image */}
            {item.image_url && (
              <img src={item.image_url} alt={item.name} className="w-full h-48 object-cover" />
            )}
            {!item.image_url && (
               <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">No Image</span>
              </div>
            )}
            <div className="p-4 flex flex-col flex-grow">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{item.name}</h3>
              <p className="text-sm text-gray-600 mb-1">Type: <span className="font-medium text-gray-700">{item.type || 'N/A'}</span></p>
              <p className="text-sm text-gray-600 mb-1">Location: <span className="font-medium text-gray-700">{item.location || 'N/A'}</span></p>
              <p className="text-lg font-bold text-blue-600 mt-2">
                ${item.price ? item.price.toLocaleString() : 'Price not available'}
              </p>
              {item.description && (
                <p className="text-gray-700 mt-2 text-sm flex-grow">{item.description.substring(0,100)}{item.description.length > 100 ? '...' : ''}</p>
              )}
              <button className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded self-start">
                View Details
              </button>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default ResultsList;
