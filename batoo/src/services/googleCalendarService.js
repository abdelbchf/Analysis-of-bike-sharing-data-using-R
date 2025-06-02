import { gapi } from 'gapi-script';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const DEFAULT_CALENDAR_ID = import.meta.env.VITE_GOOGLE_CALENDAR_ID || 'primary';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly';

let googleAuthInstance = null;

export const initGoogleClient = () => {
  return new Promise((resolve, reject) => {
    if (googleAuthInstance && gapi.client.calendar) {
      resolve(googleAuthInstance);
      return;
    }
    gapi.load('client:auth2', () => {
      gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        scope: SCOPES,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
      })
      .then(() => {
        console.log('Google API client core initialized');
        googleAuthInstance = gapi.auth2.getAuthInstance();
        return gapi.client.load('calendar', 'v3');
      })
      .then(() => {
        console.log('Google Calendar API loaded');
        resolve(googleAuthInstance);
      })
      .catch(error => {
        console.error('Error initializing Google API client or loading Calendar API:', error);
        googleAuthInstance = null;
        reject(error);
      });
    });
  });
};

export const handleSignIn = async () => {
  if (!googleAuthInstance || !gapi.client.calendar) {
    await initGoogleClient();
    if (!googleAuthInstance || !gapi.client.calendar) return Promise.reject("Initialization failed");
  }
  return googleAuthInstance.signIn();
};

export const handleSignOut = async () => {
  if (!googleAuthInstance) {
    return Promise.resolve();
  }
  return googleAuthInstance.signOut();
};

export const getIsSignedIn = () => {
  if (!googleAuthInstance) {
    return false;
  }
  return googleAuthInstance.isSignedIn.get();
};

export const getCurrentUser = () => {
    if (getIsSignedIn() && googleAuthInstance) {
        return googleAuthInstance.currentUser.get();
    }
    return null;
}

export const listenToSignInChanges = (callback) => {
  if (!googleAuthInstance) {
    initGoogleClient().then(authInstance => {
        if (authInstance) authInstance.isSignedIn.listen(callback);
    }).catch(e => console.error("Failed to init for listener", e));
    return;
  }
  googleAuthInstance.isSignedIn.listen(callback);
};

// Updated signature to include timeMax
export const listUpcomingEvents = async (
    calendarId = DEFAULT_CALENDAR_ID,
    maxResults = 10,
    timeMin = (new Date()).toISOString(),
    timeMax = null // Optional: ISO string for upper bound
  ) => {
  if (!getIsSignedIn()) {
    return [];
  }
  if (!gapi.client.calendar) {
    console.error("Calendar API not loaded.");
    try {
        await initGoogleClient();
        if(!gapi.client.calendar) throw new Error("Calendar API failed to load after re-init");
    } catch(e) {
        console.error(e);
        return [];
    }
  }

  try {
    const requestPayload = {
      'calendarId': calendarId,
      'timeMin': timeMin,
      'showDeleted': false,
      'singleEvents': true,
      'maxResults': maxResults,
      'orderBy': 'startTime',
    };
    if (timeMax) {
      requestPayload.timeMax = timeMax;
    }
    const response = await gapi.client.calendar.events.list(requestPayload);
    return response.result.items;
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return [];
  }
};

export const createCalendarEvent = async (eventDetails, calendarId = DEFAULT_CALENDAR_ID) => {
  if (!getIsSignedIn()) {
    return null;
  }
  if (!gapi.client.calendar) {
    console.error("Calendar API not loaded.");
     try {
        await initGoogleClient();
        if(!gapi.client.calendar) throw new Error("Calendar API failed to load after re-init");
    } catch(e) {
        console.error(e);
        return null;
    }
  }

  try {
    const response = await gapi.client.calendar.events.insert({
      'calendarId': calendarId,
      'resource': eventDetails,
    });
    console.log('Event created: ', response.result.htmlLink);
    return response.result;
  } catch (error) {
    console.error('Error creating event:', error.result ? error.result.error.message : error.message);
    return null;
  }
};
