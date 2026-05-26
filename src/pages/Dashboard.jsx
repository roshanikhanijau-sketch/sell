import React from 'react';
import { ShoppingBag, BookOpen, UserCheck, ArrowRight, MessageSquare, Plus } from 'lucide-react';

export default function Dashboard({ data, user, setTab, onOpenNewItemModal, onOpenNewPostModal }) {
  const itemsCount = data?.items?.length || 0;
  const notesCount = data?.notes?.length || 0;
  const feedCount = data?.feed?.length || 0;

  const featuredItems = data?.items?.slice(0, 3) || [];
  const recentPosts = data?.feed?.slice(0, 2) || [];

  return (
    <div className="animate-fade">
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="section-title">Welcome back, {user?.name}!</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            🎓 {user?.college} • <span style={{ color: 'var(--secondary-color)', fontWeight: '500' }}>Verified Student Badge</span>
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={onOpenNewPostModal}>
            <Plus size={16} /> Write Post
          </button>
          <button className="btn btn-primary" onClick={onOpenNewItemModal}>
            <Plus size={16} /> Sell Item
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '1.25rem', 
        marginBottom: '2.5rem' 
      }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-color)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <ShoppingBag size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{itemsCount}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Marketplace Items</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--secondary-color)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{notesCount}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Shared Lecture Notes</p>
          </div>
        </div>



        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success-color)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <MessageSquare size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{feedCount}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Feed Discussions</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Left Column: Featured Products & Discussion Previews */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {/* Featured Marketplace Items */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '700' }}>Recent Listings</h2>
              <button 
                onClick={() => setTab('marketplace')} 
                style={{ background: 'none', border: 'none', color: 'var(--secondary-color)', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
              >
                Browse Shop <ArrowRight size={14} />
              </button>
            </div>
            
            <div className="card-grid">
              {featuredItems.map(item => (
                <div key={item.id} className="glass-panel item-card">
                  <div className="item-image-placeholder" style={{ 
                    background: item.category === 'Books' ? 'var(--gradient-brand)' : 
                                item.category === 'Electronics' ? 'var(--gradient-cyan)' : 
                                item.category === 'Cycles' ? 'var(--gradient-emerald)' : 'var(--gradient-amber)'
                  }}>
                    <span style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}>
                      {item.category === 'Books' ? '📚' : item.category === 'Electronics' ? '⚡' : item.category === 'Cycles' ? '🚲' : '📦'}
                    </span>
                    <span className="item-category-tag">{item.category}</span>
                    <span className="item-price-tag">₹{item.price}</span>
                  </div>
                  <div className="item-body">
                    <h4 className="item-title">{item.title}</h4>
                    <p className="item-desc">{item.description}</p>
                    <div className="item-footer">
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>By {item.sellerName}</span>
                      <span className="badge badge-verified">Verified</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Feed Discussions */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '700' }}>Hot Conversations</h2>
              <button 
                onClick={() => setTab('feed')} 
                style={{ background: 'none', border: 'none', color: 'var(--secondary-color)', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
              >
                Join Feed <ArrowRight size={14} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recentPosts.map(post => (
                <div key={post.id} className="glass-panel" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--secondary-color)' }}>{post.authorName}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>• {new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {post.tags?.map((t, idx) => (
                        <span key={idx} className="feed-tag">{t}</span>
                      ))}
                    </div>
                  </div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>{post.title}</h4>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{post.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Campus Rules, Verified Badge Showcase & Quick Help */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(to bottom, rgba(99, 102, 241, 0.05), transparent)', borderLeft: '3px solid var(--primary-color)' }}>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🛡️ Verified Student Campus
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              UniHub is a private network. Every member has been validated via college email domain verification. Transactions, note shares, and roommate search are restricted to campus members. Always meet in open public spots (e.g. cafeteria, library foyer) for transactions.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>💡 Student Actions</h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li>
                <button 
                  onClick={() => setTab('roommates')} 
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', textAlign: 'left', cursor: 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  💤 Setup roommates lifestyle preferences
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setTab('notes')} 
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', textAlign: 'left', cursor: 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  📚 Access and download subject folders
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setTab('lostfound')} 
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', textAlign: 'left', cursor: 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  🔍 Report lost keys or earbud cases
                </button>
              </li>

            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
