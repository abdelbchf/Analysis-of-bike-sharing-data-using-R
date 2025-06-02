import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';
import ConversationList from '../components/ConversationList'; // Uncommented
import ChatView from '../components/ChatView'; // Uncommented

function MessagesPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedConversationPeerId, setSelectedConversationPeerId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate('/login', { replace: true, state: { message: 'You must be logged in to view messages.' } });
      }
      setLoading(false);
    };
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    if (location.state && location.state.startConversationWith) {
      // Ensure not to set if the peer is the current user itself (e.g. owner messaging themselves)
      if (user && location.state.startConversationWith === user.id) {
        // Handle self-messaging attempt if necessary, or clear state
        // console.warn("Attempting to start a conversation with oneself.");
        if (location.state && location.state.startConversationWith){ // clear state if it exists
             navigate(location.pathname, { replace: true, state: {} });
        }
        return;
      }
      setSelectedConversationPeerId(location.state.startConversationWith);
    }
  }, [location.state, user, navigate]);


  if (loading) {
    return <p className="text-center text-gray-500 mt-8">Loading messages page...</p>;
  }

  if (!user) {
    return <p className="text-center text-red-500 mt-8">Please log in to access messages.</p>;
  }

  const handleSelectConversation = (peerId) => {
    setSelectedConversationPeerId(peerId);
    if (location.state && location.state.startConversationWith) {
        navigate(location.pathname, { replace: true, state: {} }); // Clear nav state
    }
  };

  return (
    <div className="container mx-auto p-4 mt-8 h-[calc(100vh-150px)] flex flex-col">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8">My Messages</h1>
      <div className="flex-grow flex border border-gray-300 rounded-lg shadow-lg overflow-hidden">
        <div className="w-1/3 border-r border-gray-300 bg-gray-50 overflow-y-auto">
          <ConversationList
            userId={user.id}
            onSelectConversation={handleSelectConversation}
            selectedPeerId={selectedConversationPeerId}
          />
        </div>
        <div className="w-2/3 flex flex-col">
          {selectedConversationPeerId ? (
            <ChatView userId={user.id} peerId={selectedConversationPeerId} key={selectedConversationPeerId} /> // Added key to re-mount ChatView on peer change
          ) : (
            <div className="flex-grow flex items-center justify-center bg-white">
              <p className="text-gray-500 text-lg">Select a conversation to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MessagesPage;
