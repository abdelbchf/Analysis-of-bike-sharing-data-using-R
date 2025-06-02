import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import ListingForm from './ListingForm'; // Assuming ListingForm is in the same directory

function ListingsManager({ userId }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingListing, setEditingListing] = useState(null); // Listing object to edit, or null for new

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('listings')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (dbError) {
        throw dbError;
      }
      setListings(data || []);
    } catch (e) {
      console.error('Error fetching listings:', e);
      setError(e.message || 'Failed to fetch listings.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchListings();
    }
  }, [userId, fetchListings]);

  const handleCreateNew = () => {
    setEditingListing(null); // Ensure it's a new form
    setShowForm(true);
  };

  const handleEdit = (listing) => {
    setEditingListing(listing);
    setShowForm(true);
  };

  const handleDelete = async (listingId) => {
    if (window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      setLoading(true); // Indicate loading state for delete operation
      try {
        const { error: dbError } = await supabase
          .from('listings')
          .delete()
          .eq('id', listingId)
          .eq('owner_id', userId); // Ensure owner can only delete their own listings

        if (dbError) {
          throw dbError;
        }
        setListings(prevListings => prevListings.filter(l => l.id !== listingId));
        alert('Listing deleted successfully.');
      } catch (e) {
        console.error('Error deleting listing:', e);
        setError(e.message || 'Failed to delete listing.');
        alert(`Error: ${e.message || 'Failed to delete listing.'}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFormSubmit = async (formData) => {
    setLoading(true); // Indicate loading state for form submission
    try {
      let result;
      if (editingListing) { // Update existing listing
        result = await supabase
          .from('listings')
          .update({ ...formData, owner_id: userId }) // owner_id should already be there, but enforce
          .eq('id', editingListing.id)
          .eq('owner_id', userId) // Security: ensure user owns this listing
          .select();
      } else { // Create new listing
        result = await supabase
          .from('listings')
          .insert([{ ...formData, owner_id: userId }])
          .select();
      }

      const { data, error: dbError } = result;

      if (dbError) {
        throw dbError;
      }

      if (data && data.length > 0) {
        alert(`Listing ${editingListing ? 'updated' : 'created'} successfully!`);
        setShowForm(false);
        setEditingListing(null);
        fetchListings(); // Refresh the list
      } else {
        throw new Error(`No data returned after ${editingListing ? 'update' : 'creation'}.`);
      }

    } catch (e) {
      console.error(`Error ${editingListing ? 'updating' : 'creating'} listing:`, e);
      setError(e.message || `Failed to ${editingListing ? 'update' : 'create'} listing.`);
      alert(`Error: ${e.message || `Failed to ${editingListing ? 'update' : 'create'} listing.`}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingListing(null);
  };

  if (loading && listings.length === 0) return <p className="text-gray-500">Loading your listings...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="space-y-6">
      {!showForm && (
        <button
          onClick={handleCreateNew}
          className="mb-4 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md shadow"
        >
          Create New Listing
        </button>
      )}

      {showForm && (
        <ListingForm
          onSubmit={handleFormSubmit}
          initialData={editingListing}
          onCancel={handleCancelForm}
          submitButtonText={editingListing ? "Update Listing" : "Create Listing"}
        />
      )}

      <div className="mt-6 space-y-4">
        <h3 className="text-xl font-semibold text-gray-700">Your Current Listings:</h3>
        {listings.length === 0 && !loading && <p>You haven't created any listings yet.</p>}
        {listings.map((listing) => (
          <div key={listing.id} className="bg-gray-50 p-4 rounded-lg shadow flex justify-between items-center">
            <div>
              <h4 className="text-lg font-medium text-gray-800">{listing.name}</h4>
              <p className="text-sm text-gray-600">Type: {listing.type} - Location: {listing.location}</p>
              <p className="text-sm text-gray-600">Price: ${listing.price ? listing.price.toLocaleString() : 'N/A'}</p>
              <p className={`text-sm font-semibold ${listing.available ? 'text-green-600' : 'text-red-600'}`}>
                {listing.available ? 'Available' : 'Not Available'}
              </p>
            </div>
            <div className="space-x-2">
              <button onClick={() => handleEdit(listing)} className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded">Edit</button>
              <button onClick={() => handleDelete(listing.id)} className="text-sm bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded">Delete</button>
            </div>
          </div>
        ))}
      </div>
       {loading && listings.length > 0 && <p className="text-gray-500 mt-4">Updating listings...</p>}
    </div>
  );
}

export default ListingsManager;
