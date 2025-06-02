import React, { useState } from 'react';

function SearchBar({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-100 rounded-lg shadow-md">
      <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
        <input
          type="text"
          placeholder="Search for listings (e.g., yacht in Miami)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 md:mb-0"
        />
        {/* Future filter options can be added here */}
        {/*
        <select className="p-2 border border-gray-300 rounded-md mb-2 md:mb-0">
          <option value="">All Types</option>
          <option value="yacht">Yacht</option>
          <option value="jetski">Jetski</option>
          <option value="experience">Experience</option>
        </select>
        <input
          type="text"
          placeholder="Location"
          className="p-2 border border-gray-300 rounded-md mb-2 md:mb-0"
        />
        */}
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow"
        >
          Search
        </button>
      </div>
    </form>
  );
}

export default SearchBar;
