import React, { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import ResultsList from '../components/ResultsList';
import { supabase } from '../supabaseClient';

function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to handle the search logic
  const performSearch = async (currentSearchTerm) => {
    if (!currentSearchTerm.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]); // Clear previous results

    try {
      // Assuming 'listings' table and 'name', 'description' columns for searching
      // Also assuming 'type', 'location', 'price' might be available for filtering later
      const { data, error: dbError } = await supabase
        .from('listings')
        .select('*')
        .or(`name.ilike.%${currentSearchTerm}%,description.ilike.%${currentSearchTerm}%`); // Search in name OR description

      if (dbError) {
        console.error('Error fetching listings:', dbError);
        setError(dbError.message);
        setResults([]);
      } else {
        setResults(data);
      }
    } catch (e) {
      console.error('An unexpected error occurred:', e);
      setError('An unexpected error occurred. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // This function will be passed to SearchBar
  const handleSearchSubmit = (newSearchTerm) => {
    setSearchTerm(newSearchTerm);
    performSearch(newSearchTerm);
  };

  // Optional: Perform an initial empty search or load featured items
  // useEffect(() => {
  //   performSearch(''); // Example: load all or featured items initially
  // }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Find Your Next Adventure</h1>
      <SearchBar onSearch={handleSearchSubmit} />
      <ResultsList results={results} loading={loading} error={error} />
    </div>
  );
}

export default SearchPage;
