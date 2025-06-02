# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Google Calendar API Integration Setup

To enable Google Calendar integration for features like viewing availability or creating calendar events for bookings, you need to configure Google API credentials:

1.  **Set up a Google Cloud Platform Project:**
    *   Go to the [Google Cloud Console](https://console.cloud.google.com/).
    *   Create a new project or select an existing one.
    *   Enable the "Google Calendar API" for your project. You can find this in the "APIs & Services" > "Library" section.

2.  **Obtain OAuth 2.0 Client ID:**
    *   In "APIs & Services" > "Credentials", create new credentials.
    *   Choose "OAuth 2.0 Client ID".
    *   Select "Web application" as the application type.
    *   Configure the authorized JavaScript origins (e.g., `http://localhost:5173` or your Vite development server URL, and your production URL).
    *   Configure the authorized redirect URIs (e.g., for handling OAuth callbacks, often your application's URL or a specific callback path).
    *   Take note of the "Client ID" generated.

3.  **Create `.env.local` file:**
    *   In the root directory of the `batoo` project, create a file named `.env.local` if it doesn't already exist.
    *   Ensure this file is listed in your `.gitignore` file to prevent committing your credentials.

4.  **Add Environment Variables:**
    *   Open the `.env.local` file and add the following variables, replacing the placeholder values with your actual credentials:

    ```env
    VITE_GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
    # VITE_GOOGLE_API_KEY="YOUR_GOOGLE_API_KEY" # Usually not required for OAuth 2.0 client-side flows, but might be for other GAPI uses.
    # VITE_GOOGLE_CALENDAR_ID="YOUR_PRIMARY_CALENDAR_ID" # Example default calendar ID
    ```

    *   `VITE_GOOGLE_CLIENT_ID`: This is your OAuth 2.0 Client ID obtained from the Google Cloud Console.
    *   `VITE_GOOGLE_API_KEY`: This might be needed if you intend to access public calendar data or use other Google APIs that rely on an API key. For user-specific calendar data access via OAuth 2.0, it's often not directly used by the client.
    *   `VITE_GOOGLE_CALENDAR_ID`: This can be set to a default calendar ID (like `primary` for the user's main calendar, or a specific calendar's ID). In BATOO, it's anticipated that individual listings might eventually have their own associated Google Calendar IDs for managing their specific availability. These would be stored with the listing data.

5.  **Further Information:**
    *   For detailed instructions on setting up the Google Calendar API and credentials, refer to the official Google documentation:
        *   [Google Calendar API Overview](https://developers.google.com/calendar/api/guides/overview)
        *   [Setting up OAuth 2.0](https://support.google.com/cloud/answer/6158849)
        *   [Using API Keys](https://cloud.google.com/docs/authentication/api-keys)

After configuring these environment variables, the application should be able to authenticate with Google and interact with the Google Calendar API as implemented. Remember to restart your development server after making changes to `.env.local` for the new variables to be loaded.
