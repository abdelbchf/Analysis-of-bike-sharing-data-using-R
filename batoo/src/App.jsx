import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import SearchPage from './pages/SearchPage';
import ProductDetailPage from './pages/ProductDetailPage';
import OwnerDashboardPage from './pages/OwnerDashboardPage';
import MessagesPage from './pages/MessagesPage'; // Added import for MessagesPage
import { supabase } from './supabaseClient';

// Navigation Component (extracted for clarity and because it doesn't need to re-render with AppContent's state)
function Nav({ session, handleLogout }) {
  return (
    <nav className="bg-gray-800 p-4 text-white">
      <ul className="flex space-x-4 justify-center items-center">
        <li><Link to="/" className="hover:text-gray-300">Home</Link></li>
        <li><Link to="/search" className="hover:text-gray-300">Search</Link></li>
        {session && session.user ? (
          <>
            <li><Link to="/dashboard" className="hover:text-gray-300">Dashboard</Link></li>
            <li><Link to="/messages" className="hover:text-gray-300">Messages</Link></li> {/* Added Messages Link */}
            <li>
              <button onClick={handleLogout} className="hover:text-gray-300 bg-transparent border-none text-white cursor-pointer p-0">
                Logout
              </button>
            </li>
            <li className="text-sm text-gray-400">({session.user.email})</li>
          </>
        ) : (
          <>
            <li><Link to="/login" className="hover:text-gray-300">Login</Link></li>
            <li><Link to="/register" className="hover:text-gray-300">Register</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
}

function DefaultHome() {
  return (
    <div className="text-center mt-20">
      <h1 className="text-4xl font-bold text-gray-700 mb-4">Welcome to Batoo</h1>
      <p className="text-lg text-gray-600">
        Explore listings by visiting the <Link to="/search" className="text-blue-500 hover:underline">Search</Link> page.
      </p>
      <p className="text-lg text-gray-600 mt-2">
        Or <Link to="/login" className="text-blue-500 hover:underline">Login</Link> / <Link to="/register" className="text-blue-500 hover:underline">Register</Link>.
      </p>
    </div>
  );
}

// AppContent manages session and renders routes
const AppContent = () => {
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getSessionData = async () => {
      const { data: { session: currentSess } } = await supabase.auth.getSession();
      setSession(currentSess);
      setLoadingAuth(false);
    };

    getSessionData();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        // Redirect after login if on login page (and not due to session restoration)
        if (_event === 'SIGNED_IN' && window.location.pathname === '/login') {
            navigate('/dashboard');
        }
      }
    );

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [navigate]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
    } else {
      // Session will be cleared by onAuthStateChange, which will trigger re-render
      navigate('/');
    }
  };

  if (loadingAuth) {
    return <div className="text-center p-8">Loading authentication state...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Nav session={session} handleLogout={handleLogout} />
      <div className="container mx-auto p-4">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/dashboard" element={<OwnerDashboardPage />} />
          <Route path="/messages" element={<MessagesPage />} /> {/* Added Messages Route */}
          <Route path="/" element={<DefaultHome />} />
        </Routes>
      </div>
    </div>
  );
};

// Main App component wraps AppContent with BrowserRouter
function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
