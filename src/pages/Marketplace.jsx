import React, { useState } from 'react';
import { Search, Plus, Filter, MessageSquare, Tag, BadgeAlert, ShoppingBag, X } from 'lucide-react';

export default function Marketplace({ data, user, onRefreshData, onOpenChat }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New Item State
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('Books');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories = ['All', 'Books', 'Electronics', 'Cycles', 'Furniture', 'Others'];

  const filteredItems = data?.items?.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (!newTitle || !newPrice || !newCategory) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          price: Number(newPrice),
          category: newCategory,
          description: newDescription,
          sellerEmail: user.email,
          sellerName: user.name
        })
      });
      const resData = await response.json();
      setSubmitting(false);

      if (resData.success) {
        setNewTitle('');
        setNewPrice('');
        setNewDescription('');
        setShowAddModal(false);
        onRefreshData();
      }
    } catch (err) {
      setSubmitting(false);
      console.error('Error creating marketplace item:', err);
    }
  };

  return (
    <div className="animate-fade">
      <div className="section-header">
        <div>
          <h1 className="section-title">Campus Marketplace</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Buy and sell items directly with verified students on campus</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> List An Item
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel animate-fade" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search books, calculators, bikes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.75rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`semester-chip ${selectedCategory === cat ? 'active' : ''}`}
              style={{ padding: '0.6rem 1.25rem' }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <ShoppingBag size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-dim)' }} />
          <h3>No items found</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>Try adjusting your search filters or list a new item yourself!</p>
        </div>
      ) : (
        <div className="card-grid">
          {filteredItems.map(item => {
            const isOwnItem = item.sellerEmail.toLowerCase() === user.email.toLowerCase();
            return (
              <div key={item.id} className="glass-panel item-card animate-fade">
                <div className="item-image-placeholder" style={{ 
                  background: item.category === 'Books' ? 'var(--gradient-brand)' : 
                              item.category === 'Electronics' ? 'var(--gradient-cyan)' : 
                              item.category === 'Cycles' ? 'var(--gradient-emerald)' : 
                              item.category === 'Furniture' ? 'var(--gradient-coral)' : 'var(--gradient-amber)'
                }}>
                  <span style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.35))' }}>
                    {item.category === 'Books' ? '📚' : item.category === 'Electronics' ? '⚡' : item.category === 'Cycles' ? '🚲' : item.category === 'Furniture' ? '🪑' : '📦'}
                  </span>
                  <span className="item-category-tag">{item.category}</span>
                  <span className="item-price-tag">₹{item.price}</span>
                </div>

                <div className="item-body">
                  <h3 className="item-title">{item.title}</h3>
                  <p className="item-desc">{item.description}</p>
                  
                  <div className="item-footer">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>{item.sellerName}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {isOwnItem ? (
                      <span className="badge badge-verified" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>Your Listing</span>
                    ) : (
                      <button 
                        onClick={() => onOpenChat(item.sellerEmail, item.sellerName)}
                        className="btn btn-primary"
                        style={{ padding: '0.45rem 0.85rem', fontSize: '0.75rem', borderRadius: '4px' }}
                      >
                        <MessageSquare size={12} /> Contact Seller
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-pop">
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>List an Item for Sale</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateItem}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Item Name / Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Engineering Physics Textbook Vol 1"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Price (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 350"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    >
                      <option value="Books">Books</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Cycles">Cycles</option>
                      <option value="Furniture">Furniture</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Item Condition & Description</label>
                  <textarea
                    placeholder="Describe condition, usage, where you can meet up on campus for delivery..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    required
                  />
                </div>

                <div style={{ 
                  display: 'flex', 
                  gap: '0.5rem', 
                  background: 'rgba(99, 102, 241, 0.08)', 
                  border: '1px solid rgba(99, 102, 241, 0.2)', 
                  padding: '0.75rem', 
                  borderRadius: 'var(--radius-sm)', 
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  lineHeight: '1.4'
                }}>
                  <BadgeAlert size={18} style={{ color: 'var(--primary-color)', flexShrink: 0 }} />
                  <span>By submitting, you agree to fulfill pickups safely. Ensure you meet only in secure public campus spots (e.g. Library, Cafe, Hostel Reception).</span>
                </div>
              </div>

              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--bg-border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Publishing...' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
