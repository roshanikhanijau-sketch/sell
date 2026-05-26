import React, { useState } from 'react';
import { Search, MapPin, Eye, CheckCircle2, ShieldQuestion, Plus, X } from 'lucide-react';

export default function LostFound({ data, user, onRefreshData }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [claimAnswer, setClaimAnswer] = useState('');
  const [claiming, setClaiming] = useState(false);

  // New post states
  const [newType, setNewType] = useState('lost');
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredPosts = data?.lostFound?.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          post.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          post.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = activeFilter === 'All' || post.type === activeFilter.toLowerCase();
    return matchesSearch && matchesFilter;
  }) || [];

  const handleOpenClaim = (post) => {
    setSelectedPost(post);
    setShowClaimModal(true);
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!claimAnswer) return;

    setClaiming(true);
    try {
      const response = await fetch(`/api/lostfound/${selectedPost.id}/claim`, { method: 'POST' });
      const resData = await response.json();
      setClaiming(false);
      
      if (resData.success) {
        alert(`🎉 Claim request submitted! The reporter (${selectedPost.reporterName}) has been notified. They will contact you at ${selectedPost.reporterEmail} once they verify your answer: "${claimAnswer}".`);
        setShowClaimModal(false);
        setClaimAnswer('');
        onRefreshData();
      }
    } catch (err) {
      setClaiming(false);
      console.error('Error claiming item:', err);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newTitle || !newLocation) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/lostfound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newType,
          title: newTitle,
          location: newLocation,
          description: newDescription,
          reporterEmail: user.email,
          reporterName: user.name
        })
      });
      const resData = await response.json();
      setSubmitting(false);

      if (resData.success) {
        setNewTitle('');
        setNewLocation('');
        setNewDescription('');
        setShowAddModal(false);
        onRefreshData();
      }
    } catch (err) {
      setSubmitting(false);
      console.error('Error creating lost/found post:', err);
    }
  };

  return (
    <div className="animate-fade">
      <div className="section-header">
        <div>
          <h1 className="section-title">Lost & Found Bulletin</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Help classmates find lost items or report items found around campus buildings</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Report Item
        </button>
      </div>

      {/* Filter and Search */}
      <div className="glass-panel animate-fade" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search keychains, earbud cases, water bottles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.75rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['All', 'Lost', 'Found'].map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`semester-chip ${activeFilter === f ? 'active' : ''}`}
              style={{ padding: '0.6rem 1.25rem' }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      {filteredPosts.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          🔍 No reports found matching your description. Check back later!
        </div>
      ) : (
        <div className="card-grid">
          {filteredPosts.map(post => {
            const isOwnPost = post.reporterEmail.toLowerCase() === user.email.toLowerCase();
            return (
              <div key={post.id} className="glass-panel item-card animate-fade" style={{ opacity: post.status === 'claimed' ? 0.6 : 1 }}>
                
                {/* Visual Header */}
                <div className="item-image-placeholder" style={{ 
                  background: post.type === 'lost' ? 'var(--gradient-coral)' : 'var(--gradient-emerald)'
                }}>
                  <span style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}>
                    {post.type === 'lost' ? '🎒❓' : '🔑💡'}
                  </span>
                  <span className="item-category-tag" style={{ background: post.type === 'lost' ? 'var(--danger-color)' : 'var(--success-color)' }}>
                    {post.type.toUpperCase()}
                  </span>
                  {post.status === 'claimed' && (
                    <span className="item-price-tag" style={{ background: 'var(--bg-border)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      RESOLVED
                    </span>
                  )}
                </div>

                <div className="item-body">
                  <h3 className="item-title">{post.title}</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--secondary-color)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.75rem' }}>
                    <MapPin size={12} /> {post.location}
                  </p>
                  <p className="item-desc">{post.description}</p>
                  
                  <div className="item-footer">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>By {post.reporterName}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {post.status === 'claimed' ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: '600' }}>
                        <CheckCircle2 size={14} /> Returned
                      </span>
                    ) : isOwnPost ? (
                      <span className="badge badge-verified" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>Your Report</span>
                    ) : (
                      <button 
                        onClick={() => handleOpenClaim(post)}
                        className="btn btn-primary"
                        style={{ padding: '0.45rem 0.85rem', fontSize: '0.75rem', borderRadius: '4px' }}
                      >
                        {post.type === 'lost' ? 'Found It' : 'Claim Item'}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      )}

      {/* Report Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-pop">
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Report Lost or Found Item</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePost}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Report Type</label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                      <input
                        type="radio"
                        name="report-type"
                        value="lost"
                        checked={newType === 'lost'}
                        onChange={() => setNewType('lost')}
                        style={{ width: 'auto' }}
                      />
                      ❌ Lost (I lost something)
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                      <input
                        type="radio"
                        name="report-type"
                        value="found"
                        checked={newType === 'found'}
                        onChange={() => setNewType('found')}
                        style={{ width: 'auto' }}
                      />
                      ✅ Found (I found something)
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Item Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Blue JBL Earbud Case, Hostel 3 Keys"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Last Seen Location / Found Spot</label>
                  <input
                    type="text"
                    placeholder="e.g. Classroom 201, central library desk area"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description & Unique Features</label>
                  <textarea
                    placeholder="Provide details. For lost items, mention how to contact. For found items, hold back some specific details to verify claimants..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--bg-border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Publishing...' : 'Publish Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Claim / Verify Ownership Modal */}
      {showClaimModal && selectedPost && (
        <div className="modal-overlay">
          <div className="modal-content animate-pop">
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldQuestion style={{ color: 'var(--warning-color)' }} /> 
                {selectedPost.type === 'lost' ? 'I Found this Item' : 'Claim Ownership'}
              </h2>
              <button 
                onClick={() => setShowClaimModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleClaimSubmit}>
              <div className="modal-body">
                <div style={{ background: 'rgba(245, 158, 11, 0.06)', border: '1px solid var(--warning-color)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    <strong>Item Name:</strong> {selectedPost.title} <br />
                    <strong>Location:</strong> {selectedPost.location}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                    To ensure security, please describe distinguishing features. For example: stickers on the calculator, keychain color/logo, wallet contents, or specific scratches.
                  </p>
                </div>

                <div className="form-group">
                  <label>Verification Proof Description</label>
                  <textarea
                    placeholder={selectedPost.type === 'lost' ? "Describe where you found it or where you left it with security..." : "Describe the item's details that only the owner would know..."}
                    value={claimAnswer}
                    onChange={(e) => setClaimAnswer(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--bg-border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowClaimModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={claiming}>
                  {claiming ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
