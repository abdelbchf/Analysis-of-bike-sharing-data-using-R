import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom'; // Link removed as it's not used here
import ListingsManager from '../components/ListingsManager';
import OwnerBookings from '../components/OwnerBookings'; // Import OwnerBookings

function OwnerDashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate('/login', { replace: true, state: { message: 'You must be logged in to view the dashboard.' } });
      }
      setLoading(false);
    };
    fetchUser();
  }, [navigate]);

  if (loading) {
    return <p className="text-center text-gray-500 mt-8">Loading dashboard...</p>;
  }

  if (!user) {
    // This case should ideally be handled by the redirect, but as a fallback:
    return <p className="text-center text-red-500 mt-8">Please log in to access the dashboard.</p>;
  }

  return (
    <div className="container mx-auto p-4 mt-8">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8">Owner Dashboard</h1>
      <p className="text-lg text-gray-700 mb-6">Welcome, {user.email}!</p>

      {/* Full-width section for Listing Management */}
      <section className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4 border-b pb-3">Manage My Listings</h2>
        <ListingsManager userId={user.id} />
      </section>

      {/* Full-width section for Bookings */}
      <section className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4 border-b pb-3">Bookings on My Listings</h2>
        <OwnerBookings userId={user.id} /> {/* Render OwnerBookings */}
      </section>
    </div>
  );
}

export default OwnerDashboardPage;
