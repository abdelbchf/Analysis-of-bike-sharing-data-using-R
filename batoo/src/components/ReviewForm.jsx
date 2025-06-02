import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

// Simple Star Rating Component
const StarRating = ({ rating, setRating }) => {
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button" // Important: type="button" to prevent form submission
          onClick={() => setRating(star)}
          className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}
          aria-label={`Rate ${star} out of 5 stars`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

function ReviewForm({ listingId, currentUserId, onReviewSubmitted }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' }); // type: 'success' or 'error'

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setMessage({ type: 'error', text: 'Please select a rating.' });
      return;
    }
    if (!comment.trim()) {
      setMessage({ type: 'error', text: 'Please enter a comment.' });
      return;
    }

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert([
          {
            listing_id: listingId,
            user_id: currentUserId,
            rating: rating,
            comment: comment.trim(),
          },
        ])
        .select();

      if (error) {
        throw error;
      }

      setMessage({ type: 'success', text: 'Review submitted successfully!' });
      setRating(0);
      setComment('');
      if (onReviewSubmitted) {
        onReviewSubmitted(data[0]); // Pass the new review back
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setMessage({ type: 'error', text: `Failed to submit review: ${error.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmitReview} className="p-4 bg-gray-50 rounded-lg shadow space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Leave a Review</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your Rating</label>
        <StarRating rating={rating} setRating={setRating} />
      </div>

      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700">Your Comment</label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows="4"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Share your experience..."
          required
        ></textarea>
      </div>

      {message.text && (
        <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}

export default ReviewForm;
