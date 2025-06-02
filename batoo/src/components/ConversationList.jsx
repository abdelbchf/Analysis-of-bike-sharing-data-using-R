import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

function ConversationList({ userId, onSelectConversation, selectedPeerId }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Step 4: Fetch Conversations (simplified)
  // Fetches users with whom the current user has exchanged messages.
  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      // This query is a bit complex and might need optimization or a dedicated 'conversations' table.
      // It aims to find unique peer_ids from messages table.
      const { data: sentMessages, error: sentError } = await supabase
        .from('messages')
        .select('receiver_id')
        .eq('sender_id', userId);

      if (sentError) throw sentError;

      const { data: receivedMessages, error: receivedError } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('receiver_id', userId);

      if (receivedError) throw receivedError;

      const peerIds = new Set();
      sentMessages.forEach(msg => peerIds.add(msg.receiver_id));
      receivedMessages.forEach(msg => peerIds.add(msg.sender_id));

      // For now, just list peer IDs. In a real app, fetch user details (name/email) for these IDs.
      // Also, fetch last message snippet and timestamp for ordering.
      // This is a placeholder for actual conversation objects.
      const convos = Array.from(peerIds).map(id => ({
        peerId: id,
        displayName: `User ${id.substring(0, 8)}...`, // Placeholder, fetch actual user email/name
        lastMessage: "Click to see messages", // Placeholder
        lastMessageAt: new Date().toISOString() // Placeholder
      }));

      // Sort by placeholder lastMessageAt for now
      convos.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
      setConversations(convos);

    } catch (e) {
      console.error('Error fetching conversations:', e);
      setError(e.message || 'Failed to fetch conversations.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // TODO: Add Supabase real-time subscription to update conversation list on new messages from new peers.

  if (loading) return <p className="p-4 text-gray-500">Loading conversations...</p>;
  if (error) return <p className="p-4 text-red-500">Error: {error}</p>;

  if (conversations.length === 0) {
    return <p className="p-4 text-gray-500">No conversations yet.</p>;
  }

  return (
    <div className="h-full">
      <ul className="divide-y divide-gray-200">
        {conversations.map(convo => (
          <li
            key={convo.peerId}
            onClick={() => onSelectConversation(convo.peerId)}
            className={`p-4 hover:bg-gray-100 cursor-pointer ${selectedPeerId === convo.peerId ? 'bg-blue-100' : ''}`}
          >
            <div className="font-semibold text-gray-700">{convo.displayName}</div>
            <p className="text-sm text-gray-500 truncate">{convo.lastMessage}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ConversationList;
