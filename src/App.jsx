import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  BookOpen, 
  Users, 
  Search, 
  MessageSquare, 
  LogOut,
  Trash2,
  GraduationCap,
  Plus
} from 'lucide-react';

// Pages
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Feed from './pages/Feed';
import Marketplace from './pages/Marketplace';
import Notes from './pages/Notes';
import Roommates from './pages/Roommates';
import LostFound from './pages/LostFound';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState({ users: [], items: [], notes: [], lostFound: [], events: [], feed: [], services: [], chats: [] });
  const [loading, setLoading] = useState(true);
  
  // Chat States
  const [chatRecipientEmail, setChatRecipientEmail] = useState('');
  const [chatRecipientName, setChatRecipientName] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [activeChatList, setActiveChatList] = useState([]);

  // Fetch full data
  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      const json = await response.json();
      setData(json);
      setLoading(false);
      
      // Update contact list for chats
      if (user) {
        // Find chats that contain user's email
        const userChats = json.chats?.filter(c => c.id.toLowerCase().includes(user.email.toLowerCase())) || [];
        const contacts = userChats.map(c => {
          const emails = c.id.split(':');
          const otherEmail = emails.find(e => e.toLowerCase() !== user.email.toLowerCase());
          const otherUser = json.users?.find(u => u.email.toLowerCase() === otherEmail?.toLowerCase());
          return {
            email: otherEmail,
            name: otherUser ? otherUser.name : otherEmail?.split('@')[0]
          };
        }).filter(c => c.email !== undefined);
        
        // Always ensure Sophia Chen and Alex Johnson are options in the contact list for interactive feel
        const defaultContacts = [
          { email: 'sophia.senior@college.edu', name: 'Sophia Chen' },
          { email: 'alex.fresh@college.edu', name: 'Alex Johnson' }
        ];
        
        const combined = [...contacts];
        defaultContacts.forEach(dc => {
          if (!combined.some(c => c.email.toLowerCase() === dc.email.toLowerCase()) && dc.email.toLowerCase() !== user.email.toLowerCase()) {
            combined.push(dc);
          }
        });
        
        setActiveChatList(combined);
      }
    } catch (err) {
      console.error('Error fetching STU database:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check local session
    const cachedUser = localStorage.getItem('unihub_user');
    if (cachedUser) {
      setUser(JSON.parse(cachedUser));
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Sync chat messages if recipient changes
  const fetchChatMessages = async (recipientEmail) => {
    if (!user || !recipientEmail) return;
    try {
      const response = await fetch(`/api/chats/${user.email}/${recipientEmail}`);
      const messages = await response.json();
      setChatMessages(messages);
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'chats' && chatRecipientEmail) {
      fetchChatMessages(chatRecipientEmail);
      const interval = setInterval(() => fetchChatMessages(chatRecipientEmail), 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab, chatRecipientEmail]);

  const handleLoginSuccess = (loggedInUser) => {
    localStorage.setItem('unihub_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('unihub_user');
    setUser(null);
    setActiveTab('dashboard');
  };

  const handleDeleteProfile = async () => {
    if (window.confirm("Are you sure you want to permanently delete your UniHub profile? This cannot be undone.")) {
      try {
        await fetch(`/api/auth/profile/${user.email}`, { method: 'DELETE' });
        handleLogout();
      } catch (err) {
        console.error("Error deleting profile:", err);
      }
    }
  };

  const handleOpenChatWithUser = (email, name) => {
    setChatRecipientEmail(email);
    setChatRecipientName(name);
    setActiveTab('chats');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !chatRecipientEmail || !user) return;

    const messageText = chatInput;
    setChatInput('');

    // Optimistically update local message log
    const optimisticMessage = {
      sender: user.email,
      text: messageText,
      timestamp: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, optimisticMessage]);

    try {
      const response = await fetch('/api/chats/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: user.email,
          recipient: chatRecipientEmail,
          text: messageText
        })
      });
      const resData = await response.json();
      if (resData.success) {
        fetchChatMessages(chatRecipientEmail);
        fetchData(); // refresh database for auto-reply simulation
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-dark)' }}>
        <div style={{ textAlign: 'center' }}>
          <GraduationCap size={48} className="logo-text" style={{ margin: '0 auto 1rem', display: 'block' }} />
          <h2 style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Syncing with campus server...</h2>
        </div>
      </div>
    );
  }

  // Render Login page if not verified
  if (!user) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-text">
            <GraduationCap size={24} style={{ marginRight: '0.5rem', color: 'var(--primary-color)' }} />
            UniHub
          </div>

        </div>

        <nav className="nav-menu">
          <a className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard />
            <span>Dashboard</span>
          </a>
          <a className={`nav-item ${activeTab === 'feed' ? 'active' : ''}`} onClick={() => setActiveTab('feed')}>
            <MessageSquare />
            <span>Campus Feed</span>
          </a>
          <a className={`nav-item ${activeTab === 'marketplace' ? 'active' : ''}`} onClick={() => setActiveTab('marketplace')}>
            <ShoppingBag />
            <span>Marketplace</span>
          </a>
          <a className={`nav-item ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>
            <BookOpen />
            <span>Notes Sharing</span>
          </a>
          <a className={`nav-item ${activeTab === 'roommates' ? 'active' : ''}`} onClick={() => setActiveTab('roommates')}>
            <Users />
            <span>Roommate Finder</span>
          </a>
          <a className={`nav-item ${activeTab === 'lostfound' ? 'active' : ''}`} onClick={() => setActiveTab('lostfound')}>
            <Search />
            <span>Lost & Found</span>
          </a>
          <a className={`nav-item ${activeTab === 'chats' ? 'active' : ''}`} onClick={() => {
            setActiveTab('chats');
            if (activeChatList.length > 0 && !chatRecipientEmail) {
              setChatRecipientEmail(activeChatList[0].email);
              setChatRecipientName(activeChatList[0].name);
            }
          }}>
            <MessageSquare />
            <span>Direct Inbox</span>
          </a>
        </nav>

        {/* User Card */}
        <div className="user-profile-card">
          <div className="user-avatar">{user.name.charAt(0)}</div>
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-email">{user.email}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleDeleteProfile} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', display: 'flex', padding: '0.25rem' }} title="Delete Account">
              <Trash2 size={16} />
            </button>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', padding: '0.25rem' }} title="Log out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Pages Content Router */}
      <main className="main-content">
        {activeTab === 'dashboard' && (
          <Dashboard 
            data={data} 
            user={user} 
            setTab={setActiveTab} 
            onOpenNewItemModal={() => { setActiveTab('marketplace'); }} 
            onOpenNewPostModal={() => { setActiveTab('feed'); }}
          />
        )}
        
        {activeTab === 'feed' && (
          <Feed 
            data={data} 
            user={user} 
            onRefreshData={fetchData} 
          />
        )}

        {activeTab === 'marketplace' && (
          <Marketplace 
            data={data} 
            user={user} 
            onRefreshData={fetchData} 
            onOpenChat={handleOpenChatWithUser}
          />
        )}

        {activeTab === 'notes' && (
          <Notes 
            data={data} 
            user={user} 
            onRefreshData={fetchData} 
          />
        )}

        {activeTab === 'roommates' && (
          <Roommates 
            data={data} 
            user={user} 
            onRefreshData={fetchData} 
            onOpenChat={handleOpenChatWithUser}
          />
        )}

        {activeTab === 'lostfound' && (
          <LostFound 
            data={data} 
            user={user} 
            onRefreshData={fetchData} 
          />
        )}

        {activeTab === 'chats' && (
          <div className="glass-panel chat-window animate-fade">
            {/* Contacts Sidebar */}
            <div className="chat-sidebar">
              <h3 style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--bg-border)', fontSize: '1rem', fontWeight: '800' }}>Active Chats</h3>
              {activeChatList.length === 0 ? (
                <p style={{ padding: '1.5rem', textHeight: '1.5', color: 'var(--text-dim)', fontSize: '0.8rem', textAlign: 'center' }}>
                  No active conversations. Open Marketplace or Roommate lists to chat!
                </p>
              ) : (
                activeChatList.map(contact => (
                  <div 
                    key={contact.email} 
                    className={`chat-user-row ${chatRecipientEmail.toLowerCase() === contact.email.toLowerCase() ? 'active' : ''}`}
                    onClick={() => {
                      setChatRecipientEmail(contact.email);
                      setChatRecipientName(contact.name);
                    }}
                  >
                    <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}>{contact.name.charAt(0)}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{contact.name}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{contact.email}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chat Body */}
            {chatRecipientEmail ? (
              <div className="chat-main">
                <div className="chat-header">
                  <div className="user-avatar" style={{ width: '36px', height: '36px' }}>{chatRecipientName.charAt(0)}</div>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '700' }}>{chatRecipientName}</h3>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{chatRecipientEmail} • Verified Student</span>
                  </div>
                </div>

                <div className="chat-messages">
                  {chatMessages.length === 0 ? (
                    <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                      👋 Say hello to {chatRecipientName}! Ask about pickup timings or item negotiations.
                    </div>
                  ) : (
                    chatMessages.map((msg, index) => {
                      const isMe = msg.sender.toLowerCase() === user.email.toLowerCase();
                      return (
                        <div key={index} className={`chat-message-bubble ${isMe ? 'sent' : 'received'}`}>
                          <p>{msg.text}</p>
                          <span className="chat-message-time">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )
                    })
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="chat-input-area">
                  <input
                    type="text"
                    placeholder={`Message ${chatRecipientName}...`}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
                    Send
                  </button>
                </form>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)' }}>
                Select an active contact to begin chatting.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
