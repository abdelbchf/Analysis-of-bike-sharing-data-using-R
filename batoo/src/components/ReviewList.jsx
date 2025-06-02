import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

// Helper to display star ratings
const DisplayStars = ({ rating }) => {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={`text-xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}>
          ★
        </span>
      ))}
    </div>
  );
};

function ReviewList({ listingId, newReview }) { // Added newReview prop to optimistically update
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReviews = useCallback(async () => {
    if (!listingId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          user_id,
          profiles ( id, username, avatar_url )
        `) // Assuming a 'profiles' table linked to user_id for reviewer's name/avatar
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false });

      if (dbError) {
        throw dbError;
      }
      setReviews(data || []);
    } catch (e) {
      console.error('Error fetching reviews:', e);
      setError(e.message || 'Failed to fetch reviews.');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Optimistically add new review to the list
  useEffect(() => {
    if (newReview && !reviews.find(r => r.id === newReview.id)) {
      // Add new review to the top, assuming profiles data might be missing initially for it
      // Or refetch all reviews to get profile data consistently
      // For simplicity here, just adding it; ideally, newReview would have profile data or we refetch.
      // Let's refetch for consistency, or ensure onReviewSubmitted provides the joined data.
      // For now, simple prepend and hope for the best or plan to refetch.
      // setReviews(prevReviews => [newReview, ...prevReviews]);
      fetchReviews(); // Refetch to ensure all data is consistent, including profile
    }
  }, [newReview, fetchReviews]); // Removed 'reviews' from dependency array to avoid loop with fetchReviews

  if (loading && reviews.length === 0) return <p className="text-gray-500">Loading reviews...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  if (reviews.length === 0) {
    return <p className="text-gray-600">No reviews yet for this listing.</p>;
  }

  return (
    <div className="space-y-6 mt-6">
      <h3 className="text-xl font-semibold text-gray-800">Customer Reviews</h3>
      {reviews.map(review => (
        <div key={review.id} className="p-4 bg-gray-50 rounded-lg shadow">
          <div className="flex items-center mb-2">
            {/* Assuming 'profiles' table has 'username' or 'avatar_url' */}
            {review.profiles && review.profiles.avatar_url && (
              <img src={review.profiles.avatar_url} alt={review.profiles.username || 'User avatar'} className="w-10 h-10 rounded-full mr-3" />
            )}
            <div>
              <p className="font-semibold text-gray-700">
                {review.profiles ? (review.profiles.username || `User ${review.user_id.substring(0,6)}...`) : `User ${review.user_id.substring(0,6)}...`}
              </p>
              <DisplayStars rating={review.rating} />
            </div>
          </div>
          <p className="text-gray-700 mb-1">{review.comment}</p>
          <p className="text-xs text-gray-400">
            Reviewed on: {new Date(review.created_at).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}

export default ReviewList;
