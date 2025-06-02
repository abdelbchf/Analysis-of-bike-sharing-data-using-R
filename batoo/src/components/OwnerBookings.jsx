import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

function OwnerBookings({ userId }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOwnerBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // First, get all listings owned by the current user
      const { data: ownerListings, error: listingsError } = await supabase
        .from('listings')
        .select('id') // Only need IDs to filter bookings
        .eq('owner_id', userId);

      if (listingsError) {
        throw listingsError;
      }

      if (!ownerListings || ownerListings.length === 0) {
        setBookings([]); // No listings, so no bookings
        return;
      }

      const listingIds = ownerListings.map(l => l.id);

      // Then, fetch bookings for those listing IDs
      // And join with listing details to show listing name
      const { data: bookingData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          start_date,
          end_date,
          total_price,
          num_guests,
          status,
          created_at,
          listing_id,
          listings ( id, name, type )
        `)
        .in('listing_id', listingIds)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        throw bookingsError;
      }

      setBookings(bookingData || []);

    } catch (e) {
      console.error('Error fetching owner bookings:', e);
      setError(e.message || 'Failed to fetch bookings.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchOwnerBookings();
    }
  }, [userId, fetchOwnerBookings]);

  // Optional: Function to handle status updates by owner (e.g., confirm, cancel)
  // const handleUpdateBookingStatus = async (bookingId, newStatus) => { ... }

  if (loading) return <p className="text-gray-500">Loading bookings...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  if (bookings.length === 0) {
    return <p>No bookings found for your listings yet.</p>;
  }

  return (
    <div className="space-y-4 mt-4">
      {bookings.map(booking => (
        <div key={booking.id} className="bg-gray-50 p-4 rounded-lg shadow">
          <h4 className="text-md font-semibold text-gray-800">
            Booking for: {booking.listings ? booking.listings.name : `Listing ID ${booking.listing_id}`}
            {booking.listings && <span className="text-xs text-gray-500"> ({booking.listings.type})</span>}
          </h4>
          <p className="text-sm text-gray-600">
            Dates: {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-600">Guests: {booking.num_guests}</p>
          <p className="text-sm text-gray-600">Total Price: ${booking.total_price ? booking.total_price.toLocaleString() : 'N/A'}</p>
          <p className="text-sm text-gray-600">Status: <span className={`font-medium ${booking.status === 'confirmed' ? 'text-green-600' : 'text-yellow-600'}`}>{booking.status}</span></p>
          <p className="text-xs text-gray-500">Booked on: {new Date(booking.created_at).toLocaleDateString()}</p>
          {/* Add buttons for owner actions like 'Confirm Booking', 'Cancel Booking' if applicable */}
        </div>
      ))}
    </div>
  );
}

export default OwnerBookings;
