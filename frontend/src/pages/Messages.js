import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { api } from '../services/api';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');
  @keyframes fadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  
  .um-card { 
    background: rgba(255, 255, 255, 0.65) !important;
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,0.8) !important;
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .premium-input {
    width: 100%;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(8px);
    border: 1.5px solid rgba(253,230,138,0.5);
    border-radius: 14px;
    padding: 14px 18px;
    font-size: 14px;
    color: #451a03;
    outline: none;
    font-family: "'DM Sans', sans-serif";
    font-weight: 500;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
  }
  .premium-input:focus {
    background: #fff;
    border-color: #f59e0b;
    box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.15), inset 0 2px 4px rgba(0,0,0,0.01);
  }

  .gradient-btn { 
    background: linear-gradient(135deg, #f59e0b, #ea580c); 
    color: #fff; 
    border: none; 
    border-radius: 14px; 
    padding: 12px 20px; 
    font-weight: 800; 
    font-size: 14px; 
    cursor: pointer; 
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); 
    box-shadow: 0 8px 24px rgba(234, 88, 12, 0.25), inset 0 1px 1px rgba(255,255,255,0.4); 
  }
  .gradient-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(234, 88, 12, 0.35); }
  .gradient-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .convo-item { transition: all 0.2s; cursor: pointer; border-left: 3px solid transparent; }
  .convo-item:hover { background: rgba(254, 243, 199, 0.3); }
  .convo-item.active { background: #fffbeb; border-left-color: #f59e0b; }

  .message-bubble { max-width: 75%; padding: 12px 16px; border-radius: 18px; font-size: 14px; line-height: 1.4; animation: fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
  .message-sent { background: linear-gradient(135deg, #f59e0b, #ea580c); color: #fff; border-bottom-right-radius: 4px; align-self: flex-end; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.2); }
  .message-received { background: #fff; color: #451a03; border: 1px solid rgba(253,230,138,0.5); border-bottom-left-radius: 4px; align-self: flex-start; box-shadow: 0 4px 12px rgba(180,130,0,0.05); }

  /* Custom Scrollbar */
  .chat-scroll::-webkit-scrollbar { width: 6px; }
  .chat-scroll::-webkit-scrollbar-track { background: transparent; }
  .chat-scroll::-webkit-scrollbar-thumb { background: rgba(253,230,138,0.8); border-radius: 10px; }
`;

export default function Messages() {
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(null); // The user we are chatting with
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  
  const socketRef = useRef();
  const messagesEndRef = useRef(null);

  const currentUserId = (() => {
    try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return u.id || u._id || null; }
    catch { return null; }
  })();

  // Initialize Socket and fetch conversations
  useEffect(() => {
    if (!currentUserId) return;

    // Connect to Socket server
    const backendUrl = "http://localhost:5001"; // Should match your backend
    socketRef.current = io(backendUrl);

    socketRef.current.on("connect", () => {
      socketRef.current.emit("register", currentUserId);
    });

    socketRef.current.on("receiveMessage", (message) => {
      // If the message belong to the active chat
      setActiveUser(prevActive => {
          if (prevActive && (message.senderId === prevActive._id || message.senderId === prevActive.id)) {
            setMessages(prev => [...prev, message]);
             // Optional: tell server we read it right away
             api.markMessagesAsRead(message.senderId).catch(()=>{});
          } else {
             // It's from someone else -> refresh conversation list to show badge/last message
             fetchConversations();
          }
          return prevActive;
      });
    });
    
    // Receipt for sent message
    socketRef.current.on("messageSent", (message) => {
        setMessages(prev => [...prev, message]);
        fetchConversations();
    });

    fetchConversations();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  const fetchConversations = async () => {
    try {
      const res = await api.getConversations();
      if (res.success) {
        setConversations(res.conversations);
        
           // Handled externally now by the location.state useEffect
      }
    } catch (err) { console.error("Failed to load conversations", err); }
    finally { setLoading(false); }
  };

  // Handle auto-opening a chat independently of initial fetch
  useEffect(() => {
    const autoUser = location.state?.autoOpenUser;
    const autoUserId = location.state?.autoOpenUserId || (autoUser ? (autoUser._id || autoUser.id) : null);

    if (autoUserId) {
        setConversations(prevConversations => {
           // If they are already in the array, just open that chat
           const existingConvo = prevConversations.find(c => (c.user._id || c.user.id) === autoUserId);
           if (existingConvo) {
               // Only call openChat if not already active to prevent loops
               setActiveUser(currActive => {
                   if (!currActive || (currActive._id !== autoUserId && currActive.id !== autoUserId)) {
                       openChat(existingConvo.user);
                   }
                   return currActive;
               });
               return prevConversations;
           } else if (autoUser) {
               // Create temporary convo and open
               setActiveUser(currActive => {
                   if (!currActive || (currActive._id !== autoUserId && currActive.id !== autoUserId)) {
                       openChat(autoUser);
                   }
                   return currActive;
               });
               return [{ user: autoUser, lastMessage: null }, ...prevConversations];
           }
           return prevConversations;
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.autoOpenUserId, location.state?.autoOpenUser?._id, location.state?.autoOpenUser?.id]);

  const openChat = async (user) => {
    const targetId = user._id || user.id;
    setActiveUser(user);
    try {
      const res = await api.getChatHistory(targetId);
      if (res.success) {
        setMessages(res.messages);
      }
      // Clear unread
      await api.markMessagesAsRead(targetId);
      fetchConversations(); // refresh list so unread badge clears
    } catch (err) { console.error("Failed to load history", err); }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeUser || !socketRef.current) return;
    
    const targetId = activeUser._id || activeUser.id;
    socketRef.current.emit("sendMessage", {
      senderId: currentUserId,
      receiverId: targetId,
      content: newMessage.trim()
    });

    setNewMessage("");
  };

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  return (
    <div style={{
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
      background: 'radial-gradient(ellipse at top right, rgba(253,230,138,0.35), transparent 70%), radial-gradient(ellipse at bottom left, rgba(254,215,170,0.35), transparent 70%), #fffdf5',
      backgroundSize: '200% 200%',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden'
    }}>
      <style>{CSS}</style>

      {/* HEADER */}
      <div style={{ padding: '32px 24px 24px', flexShrink: 0 }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', animation: 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <h1 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 900, color: '#451a03', fontFamily: "'Playfair Display',serif", letterSpacing: -1 }}>💬 Messages</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#92400e', fontWeight: 500 }}>Communicate clearly. Trade safely.</p>
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px 32px', flex: 1, display: 'flex', width: '100%', gap: 20, height: 'calc(100vh - 120px)', boxSizing: 'border-box' }}>
        
        {/* LEFT COLUMN: Conversations */}
        <div className="um-card" style={{ width: 320, borderRadius: 24, display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(253,230,138,0.5)' }}>
             <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#78350f' }}>Recent Chats</h2>
          </div>
          
          <div className="chat-scroll" style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#b45309', fontSize: 14 }}>Loading...</div>
            ) : conversations.length === 0 ? (
               <div style={{ padding: 32, textAlign: 'center' }}>
                 <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                 <p style={{ margin: 0, color: '#92400e', fontSize: 13, fontWeight: 500 }}>No conversations yet.</p>
               </div>
            ) : (
               conversations.map((c, i) => {
                 const u = c.user;
                 const isActive = activeUser && (activeUser._id === u._id || activeUser.id === u._id);
                 const hasUnread = c.lastMessage && !c.lastMessage.read && String(c.lastMessage.receiverId) === String(currentUserId);
                 
                 return (
                 <div key={i} onClick={() => openChat(u)} className={`convo-item ${isActive ? 'active' : ''}`} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid rgba(253,230,138,0.2)' }}>
                   <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#fef08a,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#92400e', fontWeight: 900, fontSize: 18, flexShrink: 0, position: 'relative' }}>
                     {u.name?.charAt(0) || 'U'}
                     {hasUnread && <div style={{ position: 'absolute', top: -4, right: -4, width: 12, height: 12, background: '#ef4444', borderRadius: '50%', border: '2px solid #fff' }} />}
                   </div>
                   <div style={{ flex: 1, minWidth: 0 }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                       <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#451a03', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</h3>
                       {c.lastMessage && <span style={{ fontSize: 10, color: '#b45309', fontWeight: 600 }}>
                          {new Date(c.lastMessage.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                       </span>}
                     </div>
                     <p style={{ margin: 0, fontSize: 12, color: hasUnread ? '#451a03' : '#92400e', fontWeight: hasUnread ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: hasUnread ? 1 : 0.8 }}>
                        {c.lastMessage ? (String(c.lastMessage.senderId) === String(currentUserId) ? `You: ${c.lastMessage.content}` : c.lastMessage.content) : "Start chatting..."}
                     </p>
                   </div>
                 </div>
               )})
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Chat */}
        <div className="um-card" style={{ flex: 1, borderRadius: 24, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          {activeUser ? (
            <>
              {/* Chat Header */}
              <div style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(253,230,138,0.5)', display: 'flex', alignItems: 'center', gap: 14 }}>
                 <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#fef08a,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#92400e', fontWeight: 900, fontSize: 16 }}>
                     {activeUser.name?.charAt(0) || 'U'}
                 </div>
                 <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#451a03' }}>{activeUser.name}</h3>
                 </div>
              </div>

              {/* Chat History */}
              <div className="chat-scroll" style={{ flex: 1, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                 {messages.map((m, i) => {
                    const isMine = String(m.senderId) === String(currentUserId);
                    return (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                         <div className={`message-bubble ${isMine ? 'message-sent' : 'message-received'}`}>
                           {m.content}
                         </div>
                         <span style={{ fontSize: 10, color: '#b45309', marginTop: 4, opacity: 0.7, fontWeight: 600 }}>
                           {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                         </span>
                      </div>
                    )
                 })}
                 <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.4)', borderTop: '1px solid rgba(253,230,138,0.5)' }}>
                 <form onSubmit={sendMessage} style={{ display: 'flex', gap: 12 }}>
                    <input 
                       className="premium-input" 
                       placeholder="Type your message..." 
                       value={newMessage}
                       onChange={e => setNewMessage(e.target.value)}
                       style={{ flex: 1 }}
                    />
                    <button type="submit" className="gradient-btn" disabled={!newMessage.trim()}>Send 🚀</button>
                 </form>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
               <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(253,230,138,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, marginBottom: 16 }}>
                 💬
               </div>
               <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: '#78350f' }}>No Chat Selected</h3>
               <p style={{ margin: 0, color: '#92400e', fontSize: 14, fontWeight: 500 }}>Select a conversation from the left to start messaging.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
