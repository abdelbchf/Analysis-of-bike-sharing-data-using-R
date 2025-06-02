import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import BookingForm from '../components/BookingForm';
import ReviewList from '../components/ReviewList';
import ReviewForm from '../components/ReviewForm';
import {
  initGoogleClient,
  handleSignIn as handleGoogleSignIn,
  getIsSignedIn as getIsGoogleSignedIn,
  listenToSignInChanges as listenToGoogleSignInChanges,
  listUpcomingEvents as listGoogleUpcomingEvents,
  getCurrentUser as getCurrentGoogleUser,
  createCalendarEvent // Import createCalendarEvent
} from '../services/googleCalendarService';

// Helper to display star ratings
const DisplayAverageStars = ({ rating, count }) => {
  if (count === 0) return <span className="text-sm text-gray-500">No reviews yet</span>;
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={`text-xl ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
      ))}
      <span className="ml-2 text-gray-600">({count} review{count > 1 ? 's' : ''})</span>
    </div>
  );
};

function ProductDetailPage() {
  const { id: listingId } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [currentUser, setCurrentUser] = useState(null); // Supabase user
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingMessage, setBookingMessage] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [newlySubmittedReview, setNewlySubmittedReview] = useState(null);

  const [isGoogleClientLoaded, setIsGoogleClientLoaded] = useState(false);
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
  const [googleAuthError, setGoogleAuthError] = useState(null);
  const [googleUser, setGoogleUser] = useState(null);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loadingCalendarEvents, setLoadingCalendarEvents] = useState(false);
  const VITE_DEFAULT_GOOGLE_CALENDAR_ID = import.meta.env.VITE_GOOGLE_CALENDAR_ID || 'primary';

  useEffect(() => {
    initGoogleClient()
      .then(() => {
        setIsGoogleClientLoaded(true);
        const signedIn = getIsGoogleSignedIn();
        setIsGoogleSignedIn(signedIn);
        if (signedIn) setGoogleUser(getCurrentGoogleUser()?.getBasicProfile());
        listenToGoogleSignInChanges((isSignedIn) => {
          setIsGoogleSignedIn(isSignedIn);
          if (isSignedIn) {
            setGoogleUser(getCurrentGoogleUser()?.getBasicProfile());
            setGoogleAuthError(null);
          } else {
            setGoogleUser(null);
            setCalendarEvents([]);
          }
        });
      })
      .catch(err => {
        console.error("Error initializing Google Client:", err);
        setGoogleAuthError("Failed to load Google services. Calendar features may be unavailable.");
        setIsGoogleClientLoaded(true);
      });
  }, []);

  const fetchListingData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
    try {
      const { data: listingData, error: listingError } = await supabase.from('listings').select('*').eq('id', listingId).single();
      if (listingError) throw listingError;
      if (!listingData) throw new Error('Listing not found.');
      setListing(listingData);
      const { data: reviewData, error: reviewError } = await supabase.from('reviews').select('rating').eq('listing_id', listingId);
      if (reviewError) throw reviewError;
      setReviews(reviewData || []);
      if (reviewData && reviewData.length > 0) {
        const totalRating = reviewData.reduce((acc, r) => acc + r.rating, 0);
        setAverageRating(totalRating / reviewData.length);
        setReviewCount(reviewData.length);
      } else { setAverageRating(0); setReviewCount(0); }
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [listingId]);

  useEffect(() => { fetchListingData(); }, [fetchListingData]);

  useEffect(() => {
    if (isGoogleSignedIn && listing) {
      setLoadingCalendarEvents(true);
      const calendarIdToUse = listing.google_calendar_id || VITE_DEFAULT_GOOGLE_CALENDAR_ID;
      if (!calendarIdToUse) { setLoadingCalendarEvents(false); setCalendarEvents([]); return; }
      const timeMin = new Date().toISOString();
      const timeMax = new Date(new Date().setDate(new Date().getDate() + 60)).toISOString();
      listGoogleUpcomingEvents(calendarIdToUse, 50, timeMin, timeMax)
        .then(events => setCalendarEvents(events || []))
        .catch(err => setGoogleAuthError("Could not fetch calendar events."))
        .finally(() => setLoadingCalendarEvents(false));
    } else { setCalendarEvents([]); }
  }, [isGoogleSignedIn, listing, VITE_DEFAULT_GOOGLE_CALENDAR_ID]);

  const handleGoogleSignInClick = async () => { /* ... (same as before) ... */ try { await handleGoogleSignIn(); } catch (error) { setGoogleAuthError(error.details || "Failed to sign in with Google."); }};

  const handleBookingSubmit = async (bookingDetails) => {
    setIsBooking(true);
    setBookingMessage('');
    let supabaseBookingSuccessful = false;
    let newBookingId = null;

    if (!currentUser) {
      setBookingMessage('You need to be logged in to make a booking. Redirecting to login...');
      setTimeout(() => navigate('/login', { state: { from: `/product/${listingId}` } }), 3000);
      setIsBooking(false);
      return;
    }

    try {
      const bookingDataToInsert = {
        listing_id: listingId,
        user_id: currentUser.id,
        start_date: bookingDetails.startDate,
        end_date: bookingDetails.endDate,
        total_price: bookingDetails.totalPrice,
        num_guests: bookingDetails.numGuests,
        status: 'confirmed',
      };
      const { data: bookingResult, error: bookingError } = await supabase
        .from('bookings')
        .insert([bookingDataToInsert])
        .select()
        .single(); // Assuming insert returns the created row if select() is used

      if (bookingError) throw bookingError;

      if (bookingResult) {
        newBookingId = bookingResult.id;
        setBookingMessage(`Booking successful! Confirmation ID: ${newBookingId}.`);
        supabaseBookingSuccessful = true;
      } else {
        throw new Error("Booking creation did not return expected data.");
      }

    } catch (e) {
      setBookingMessage(`Booking failed: ${e.message}`);
      supabaseBookingSuccessful = false;
    } finally {
      setIsBooking(false); // Initial Supabase booking attempt finished
    }

    // If Supabase booking was successful, try to add to Google Calendar
    if (supabaseBookingSuccessful && isGoogleSignedIn && listing) {
      const calendarIdToUse = listing.google_calendar_id || VITE_DEFAULT_GOOGLE_CALENDAR_ID;
      if (!calendarIdToUse) {
        console.warn("No Google Calendar ID for listing and no default. Skipping calendar event creation.");
        setBookingMessage(prev => prev + " (Could not add to Google Calendar: No calendar ID configured for listing)");
        return;
      }

      // Prepare event details
      // Ensure dates are correctly formatted for Google Calendar (ISO strings)
      // Google Calendar API usually expects full ISO 8601, but date-only strings for all-day events.
      // For specific times, ensure time is included. For simplicity, using date-only for now.
      // A proper implementation would use full dateTime if listing type implies specific times.
      const eventStartDate = new Date(bookingDetails.startDate).toISOString().split('T')[0];
      const eventEndDate = new Date(new Date(bookingDetails.endDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Google end date is exclusive for all-day

      const eventDetailsForGoogle = {
        summary: `Booking for ${listing.name}`,
        description: `Booked by ${currentUser.email || 'a user'}.\nGuests: ${bookingDetails.numGuests}.\nBATOO Booking ID: ${newBookingId}`,
        start: { date: eventStartDate }, // Assumes all-day event
        end: { date: eventEndDate },     // Assumes all-day event
        location: listing.location || '',
      };

      // Default Timezone - Note: This should be dynamic or configurable
      // For date-only events, timezone might not be strictly required by API but good for consistency.
      // eventDetailsForGoogle.start.timeZone = 'UTC';
      // eventDetailsForGoogle.end.timeZone = 'UTC';

      try {
        const createdEvent = await createCalendarEvent(eventDetailsForGoogle, calendarIdToUse);
        if (createdEvent && createdEvent.htmlLink) {
          setBookingMessage(prev => prev + " Also added to Google Calendar.");
          console.log('Google Calendar event created:', createdEvent.htmlLink);
          // Optionally, refresh calendar events on page if needed
          // listGoogleUpcomingEvents(calendarIdToUse, ...).then(setCalendarEvents);
        } else {
          throw new Error("Failed to create Google Calendar event or no link returned.");
        }
      } catch (calError) {
        console.error('Error creating Google Calendar event:', calError);
        setBookingMessage(prev => prev + " (Failed to add to Google Calendar - please check permissions or try again later)");
      }
    } else if (supabaseBookingSuccessful && !isGoogleSignedIn && listing && listing.google_calendar_id) {
        setBookingMessage(prev => prev + " (Sign in to Google to add this booking to your calendar automatically next time!)");
    }
  };

  const handleMessageOwner = () => { /* ... (same as before) ... */ if (!currentUser) { navigate('/login'); return; } if (listing && listing.owner_id && listing.owner_id !== currentUser.id) { navigate('/messages', { state: { startConversationWith: listing.owner_id } }); }};
  const handleReviewSubmitted = (newReview) => { /* ... (same as before) ... */ setNewlySubmittedReview(newReview); const updatedReviews = [...reviews, newReview]; setReviews(updatedReviews); const totalRating = updatedReviews.reduce((acc, review) => acc + review.rating, 0); setAverageRating(totalRating / updatedReviews.length); setReviewCount(updatedReviews.length); };

  if (loading) return <p className="text-center text-gray-500 mt-8">Loading...</p>;
  if (error) return <p className="text-center text-red-500 mt-8">Error: {error}</p>;
  if (!listing) return <p className="text-center text-gray-500 mt-8">Listing not found.</p>;

  const canMessageOwner = currentUser && listing.owner_id && currentUser.id !== listing.owner_id;
  const canShowReviewForm = currentUser && listing.owner_id !== currentUser?.id;

  return (
    <div className="container mx-auto p-4 mt-8">
      <div className="lg:flex lg:space-x-8">
        <div className="lg:w-2/3">
          <div className="bg-white shadow-xl rounded-lg overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-4"><div><h1 className="text-3xl md:text-4xl font-bold text-gray-800">{listing.name}</h1><div className="mt-2"><DisplayAverageStars rating={averageRating} count={reviewCount} /></div></div>{canMessageOwner && (<button onClick={handleMessageOwner} className="ml-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md shadow whitespace-nowrap">Message Owner</button>)}</div>
              <p className="text-gray-600 text-sm mb-2">Type: <span className="font-medium text-gray-700">{listing.type || 'N/A'}</span></p>
              <p className="text-gray-600 text-sm mb-2">Location: <span className="font-medium text-gray-700">{listing.location || 'N/A'}</span></p>
              <div className="my-4"><h2 className="text-2xl font-semibold text-gray-700 mb-2">Description</h2><p className="text-gray-700 leading-relaxed">{listing.description || 'No description.'}</p></div>
              <div className="my-4"><h2 className="text-2xl font-semibold text-gray-700 mb-2">Pricing</h2><p className="text-3xl font-bold text-blue-600">${listing.price ? listing.price.toLocaleString() : 'N/A'}</p></div>
              <div className="my-4">
                <h2 className="text-2xl font-semibold text-gray-700 mb-2">Availability</h2>
                <p className="text-gray-700 mb-2">{listing.available ? "This listing is generally available." : "This listing is currently not available."}</p>
                {!isGoogleClientLoaded && <p className="text-sm text-gray-500">Loading Google Calendar integration...</p>}
                {googleAuthError && <p className="text-sm text-red-500">{googleAuthError}</p>}
                {isGoogleClientLoaded && !isGoogleSignedIn && (<button onClick={handleGoogleSignInClick} className="my-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Sign in with Google to check detailed availability</button>)}
                {isGoogleSignedIn && googleUser && (<p className="text-sm text-green-600 mb-2">Signed in to Google as: {googleUser.getName()} ({googleUser.getEmail()})</p>)}
                {isGoogleSignedIn && loadingCalendarEvents && <p className="text-sm text-gray-500">Loading calendar events...</p>}
                {isGoogleSignedIn && !loadingCalendarEvents && calendarEvents.length > 0 && (<div className="mt-2 space-y-1"><h4 className="text-md font-semibold text-gray-600">Upcoming Busy Slots:</h4><ul className="list-disc list-inside text-sm text-red-600">{calendarEvents.map(event => (<li key={event.id}>{event.summary} (From: {new Date(event.start.dateTime || event.start.date).toLocaleString()} To: {new Date(event.end.dateTime || event.end.date).toLocaleString()})</li>))}</ul></div>)}
                {isGoogleSignedIn && !loadingCalendarEvents && calendarEvents.length === 0 && !googleAuthError && listing.google_calendar_id && (<p className="text-sm text-green-500">No upcoming busy slots found in the calendar for the next 60 days.</p>)}
                {isGoogleSignedIn && !listing.google_calendar_id && !VITE_DEFAULT_GOOGLE_CALENDAR_ID && (<p className="text-sm text-orange-500">Calendar ID for this listing is not configured.</p>)}
              </div>
            </div>
          </div>
          <div className="mt-8 bg-white shadow-xl rounded-lg p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6">Reviews</h2>
            {canShowReviewForm && (<div className="mb-8"><ReviewForm listingId={listingId} currentUserId={currentUser?.id} onReviewSubmitted={handleReviewSubmitted} /></div>)}
            <ReviewList listingId={listingId} newReview={newlySubmittedReview} />
          </div>
        </div>
        <div className="lg:w-1/3 mt-8 lg:mt-0">
          <div className="bg-white shadow-xl rounded-lg p-6 sticky top-8">
             <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Book This Listing</h2>
             {listing.available ? (<BookingForm listing={listing} onSubmitBooking={handleBookingSubmit} calendarEvents={calendarEvents} />) : (<p className="text-center text-red-600 font-semibold">This listing is currently not available for booking.</p>)}
             {isBooking && <p className="mt-4 text-center text-blue-600">Processing your booking...</p>}
             {bookingMessage && <p className={`mt-4 text-center ${bookingMessage.includes('failed') || bookingMessage.includes('need to be logged in') ? 'text-red-600' : 'text-green-600'}`}>{bookingMessage}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;
