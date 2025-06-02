import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo

// Helper function to get all dates within a range
const getDatesInRange = (startDate, endDate) => {
  const dates = [];
  let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()); // Normalize to start of day
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()); // Normalize to start of day

  while (currentDate <= end) {
    dates.push(new Date(currentDate)); // Store as Date objects
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

// Helper function to process calendar events into a set of busy date strings (YYYY-MM-DD)
const getBusyDateStrings = (calendarEvents) => {
  const busyDates = new Set();
  if (!calendarEvents) return busyDates;

  calendarEvents.forEach(event => {
    // Google Calendar API returns 'date' for all-day events, 'dateTime' for timed events
    const eventStart = new Date(event.start.date || event.start.dateTime);
    // For all-day events, Google Calendar's end date is exclusive.
    // For timed events, use the actual end time.
    const eventEnd = new Date(event.end.date ? new Date(new Date(event.end.date).getTime() - 24*60*60*1000) : event.end.dateTime); // Adjust for exclusive end date for all-day events

    const datesInEventRange = getDatesInRange(eventStart, eventEnd);
    datesInEventRange.forEach(date => {
      busyDates.add(date.toISOString().split('T')[0]); // Store in YYYY-MM-DD format
    });
  });
  return busyDates;
};


function BookingForm({ listing, onSubmitBooking, calendarEvents = [] }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [numGuests, setNumGuests] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [formMessage, setFormMessage] = useState('');
  const [availabilityWarning, setAvailabilityWarning] = useState('');

  // Memoize the set of busy date strings
  const busyDateStrings = useMemo(() => getBusyDateStrings(calendarEvents), [calendarEvents]);

  // Displayable list of busy dates (formatted)
  const displayableBusyDates = useMemo(() => {
    return Array.from(busyDateStrings).sort().map(dateStr =>
        new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
    );
  }, [busyDateStrings]);


  // Calculate total price
  useEffect(() => {
    // ... (price calculation logic remains the same) ...
    if (startDate && endDate && listing && listing.price) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end > start) {
        const numNights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        setTotalPrice(numNights * listing.price);
        setFormMessage('');
      } else if (end.getTime() === start.getTime() && listing.price_per_unit === 'day') {
        setTotalPrice(listing.price);
        setFormMessage('');
      } else if (end < start) {
        setTotalPrice(0);
        setFormMessage('End date must be after start date.');
      } else { setTotalPrice(0); }
    } else { setTotalPrice(0); }
  }, [startDate, endDate, listing]);

  // Check for clashes with Google Calendar events (updated logic)
  useEffect(() => {
    setAvailabilityWarning('');
    if (startDate && endDate) {
      const selectedStartObj = new Date(new Date(startDate).setHours(0,0,0,0));
      const selectedEndObj = new Date(new Date(endDate).setHours(0,0,0,0)); // Compare day by day

      const selectedDates = getDatesInRange(selectedStartObj, selectedEndObj);
      const clashingDates = [];

      for (const date of selectedDates) {
        const dateString = date.toISOString().split('T')[0];
        if (busyDateStrings.has(dateString)) {
          clashingDates.push(date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
        }
      }

      if (clashingDates.length > 0) {
        setAvailabilityWarning(`Warning: The following date(s) in your selection are busy: ${clashingDates.join(', ')}.`);
      }
    }
  }, [startDate, endDate, busyDateStrings]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // ... (existing validation for price and date order) ...
    if (totalPrice <= 0 && !(startDate === endDate && listing.price_per_unit === 'day')) {
        if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
             setFormMessage('End date cannot be before start date.');
        } else if (!startDate || !endDate) {
            setFormMessage('Please select start and end dates.');
        } else {
            setFormMessage('Please ensure dates are valid for price calculation.');
        }
        return;
    }
    if (availabilityWarning) {
        if (!window.confirm(availabilityWarning + "\nDo you want to proceed with the booking request anyway?")) {
            return;
        }
    }
    setFormMessage('');
    onSubmitBooking({
      listingId: listing.id,
      startDate,
      endDate,
      numGuests,
      totalPrice,
    });
  };

  if (!listing) return <p>Loading booking information...</p>;

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-gray-50 rounded-lg shadow-lg space-y-4">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Request to Book</h3>

      {/* Display Processed Busy Dates */}
      {calendarEvents.length > 0 && displayableBusyDates.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm font-medium text-yellow-700">Known Busy Dates (from Calendar):</p>
          <ul className="list-disc list-inside text-xs text-yellow-600 mt-1 max-h-20 overflow-y-auto">
            {displayableBusyDates.map(dateStr => <li key={dateStr}>{dateStr}</li>)}
          </ul>
        </div>
      )}
       {calendarEvents.length > 0 && displayableBusyDates.length === 0 && (
         <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm font-medium text-green-700">Calendar connected. No busy dates found in the near future.</p>
         </div>
       )}


      <div>
        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
        <input
          type="date"
          id="startDate"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
        <input
          type="date"
          id="endDate"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          min={startDate || new Date().toISOString().split('T')[0]}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          required
        />
      </div>

      {availabilityWarning && (
        <p className="text-sm text-orange-600 bg-orange-100 p-2 rounded-md">{availabilityWarning}</p>
      )}

      {/* ... (numGuests, totalPrice, formMessage, button remain the same) ... */}
      <div>
        <label htmlFor="numGuests" className="block text-sm font-medium text-gray-700">Number of Guests</label>
        <input type="number" id="numGuests" value={numGuests} onChange={(e) => setNumGuests(parseInt(e.target.value, 10))} min="1" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
      </div>
      {totalPrice > 0 && (<div className="py-2"><p className="text-lg font-semibold text-gray-800">Total Price: <span className="text-blue-600">${totalPrice.toLocaleString()}</span></p></div>)}
      {formMessage && (<p className="text-sm text-red-600">{formMessage}</p>)}
      <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md shadow-md transition duration-150 ease-in-out disabled:opacity-50" disabled={totalPrice <= 0 && !(startDate === endDate && listing.price_per_unit === 'day')}> Book Now </button>
    </form>
  );
}

export default BookingForm;
