import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

function ChatView({ userId, peerId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null); // For scrolling to bottom

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Step 4: Fetch Messages for a Conversation
  const fetchMessages = useCallback(async () => {
    if (!userId || !peerId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('messages')
        .select('*')
        .or(`(sender_id.eq.${userId},receiver_id.eq.${peerId}),(sender_id.eq.${peerId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true });

      if (dbError) throw dbError;
      setMessages(data || []);
    } catch (e) {
      console.error('Error fetching messages:', e);
      setError(e.message || 'Failed to fetch messages.');
    } finally {
      setLoading(false);
    }
  }, [userId, peerId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(scrollToBottom, [messages]);

  // Step 4: Real-time Updates
  useEffect(() => {
    if (!userId || !peerId) return;

    // Define a unique channel ID for this pair of users
    // Ensure consistent order of user IDs for the channel name
    const channelName = `messages_user_${Math.min(userId, peerId)}_user_${Math.max(userId, peerId)}`;

    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          // Filter for messages involving either user in this pair
          // Note: Supabase filter syntax might be limited for complex OR on sender/receiver for a specific pair.
          // A robust solution might involve a conversation_id or a more specific channel.
          // For now, we'll rely on the channel being specific enough or client-side filter.
          // Let's assume the channel itself is the primary boundary, or add a filter if possible.
          // A simple filter could be on a `conversation_id` if we adopt that.
          // Without `conversation_id`, filtering for the pair on the DB is tricky with current filter capabilities.
          // We'll fetch the new message and check if it belongs to this conversation client-side.
        },
        (payload) => {
          const newMessagePayload = payload.new;
          // Client-side check to ensure the message belongs to the current conversation view
          if (
            (newMessagePayload.sender_id === userId && newMessagePayload.receiver_id === peerId) ||
            (newMessagePayload.sender_id === peerId && newMessagePayload.receiver_id === userId)
          ) {
            setMessages(prevMessages => [...prevMessages, newMessagePayload]);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to channel: ${channelName}`);
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.error(`Subscription error on ${channelName}:`, status, err);
          // Optionally, attempt to resubscribe or notify user
        }
      });

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId, peerId]);


  // Step 4: Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId || !peerId) return;

    try {
      const messageData = {
        sender_id: userId,
        receiver_id: peerId,
        content: newMessage.trim(),
        // conversation_id would be set here if using it
      };
      const { error: dbError } = await supabase.from('messages').insert([messageData]);
      if (dbError) throw dbError;
      setNewMessage(''); // Clear input field
      // The real-time subscription should ideally handle adding the message to the UI.
      // If not, uncomment below for optimistic update (but ensure it doesn't duplicate with subscription)
      // setMessages(prevMessages => [...prevMessages, { ...messageData, created_at: new Date().toISOString(), id: Date.now() }]); // Temporary ID
    } catch (e) {
      console.error('Error sending message:', e);
      setError(e.message || 'Failed to send message.'); // Show error in UI
    }
  };

  if (loading) return <p className="p-4 text-gray-500 text-center">Loading messages...</p>;
  if (error && messages.length === 0) return <p className="p-4 text-red-500 text-center">Error: {error}</p>;
  // If there's an error but also old messages, we can show both.

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow p-4 space-y-4 overflow-y-auto bg-gray-100">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow ${
                msg.sender_id === userId
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-800 border border-gray-200'
            }`}>
              <p className="text-sm">{msg.content}</p>
              <p className={`text-xs mt-1 ${msg.sender_id === userId ? 'text-blue-200' : 'text-gray-400'} text-right`}>
                {new Date(msg.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {error && <p className="p-2 text-center text-red-500 text-xs">Error: {error}</p>}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-300 bg-white">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow">
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatView;
