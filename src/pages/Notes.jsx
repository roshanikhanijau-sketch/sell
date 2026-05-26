import React, { useState } from 'react';
import { BookOpen, Download, Star, Brain, Plus, Search, Check, FolderOpen, Loader } from 'lucide-react';

export default function Notes({ data, user, onRefreshData }) {
  const [selectedSem, setSelectedSem] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [ratingLoading, setRatingLoading] = useState({});
  
  // AI summary states
  const [summaryNoteId, setSummaryNoteId] = useState(null);
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // New Note state
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newSem, setNewSem] = useState('1');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const semesters = ['All', 'Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'];

  const filteredNotes = data?.notes?.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          note.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesSem = true;
    if (selectedSem !== 'All') {
      const semNum = parseInt(selectedSem.split(' ')[1]);
      matchesSem = note.semester === semNum;
    }
    
    return matchesSearch && matchesSem;
  }) || [];

  const handleDownload = async (noteId) => {
    try {
      const response = await fetch(`/api/notes/${noteId}/download`, { method: 'POST' });
      const resData = await response.json();
      if (resData.success) {
        onRefreshData();
        // Simulate downloading a file by showing an alert
        alert('📥 File download initiated! Notes saved as PDF.');
      }
    } catch (err) {
      console.error('Error tracking download:', err);
    }
  };

  const handleRateNote = async (noteId, ratingValue) => {
    setRatingLoading(prev => ({ ...prev, [noteId]: true }));
    try {
      const response = await fetch(`/api/notes/${noteId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: ratingValue })
      });
      const resData = await response.json();
      setRatingLoading(prev => ({ ...prev, [noteId]: false }));
      if (resData.success) {
        onRefreshData();
      }
    } catch (err) {
      setRatingLoading(prev => ({ ...prev, [noteId]: false }));
      console.error('Error rating note:', err);
    }
  };

  const handleFetchSummary = async (note) => {
    setSummaryNoteId(note.id);
    setAiLoading(true);
    setAiSummary('');
    try {
      const response = await fetch('/api/notes/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: note.title, description: note.description })
      });
      const resData = await response.json();
      setAiLoading(false);
      if (resData.success) {
        setAiSummary(resData.summary);
      }
    } catch (err) {
      setAiLoading(false);
      console.error('Error summarizing notes:', err);
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!newTitle || !newSubject || !newSem) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          subject: newSubject,
          semester: Number(newSem),
          description: newDescription,
          uploaderEmail: user.email,
          uploaderName: user.name
        })
      });
      const resData = await response.json();
      setSubmitting(false);

      if (resData.success) {
        setNewTitle('');
        setNewSubject('');
        setNewDescription('');
        setShowAddModal(false);
        onRefreshData();
      }
    } catch (err) {
      setSubmitting(false);
      console.error('Error sharing note:', err);
    }
  };

  return (
    <div className="animate-fade" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem' }}>
      {/* Main Study folders */}
      <div>
        <div className="section-header">
          <div>
            <h1 className="section-title">Notes Sharing Hub</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Upload notes, download PYQs (Previous Year Questions), and browse courses</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Share Material
          </button>
        </div>

        {/* Search */}
        <div className="glass-panel animate-fade" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by subject or topic name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.75rem' }}
            />
          </div>
        </div>

        {/* Semester Chips */}
        <div className="semester-chips">
          {semesters.map(sem => (
            <button
              key={sem}
              onClick={() => setSelectedSem(sem)}
              className={`semester-chip ${selectedSem === sem ? 'active' : ''}`}
            >
              {sem}
            </button>
          ))}
        </div>

        {/* Notes listings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
          {filteredNotes.length === 0 ? (
            <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FolderOpen size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-dim)' }} />
              <h3>No study notes found</h3>
              <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>Be the first to upload lecture handouts or lab manuals for Semester {selectedSem}!</p>
            </div>
          ) : (
            filteredNotes.map(note => (
              <div key={note.id} className="glass-panel animate-fade" style={{ padding: '1.5rem', display: 'flex', gap: '1.25rem' }}>
                <div style={{ 
                  background: 'var(--gradient-brand)', 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: 'var(--radius-sm)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'white',
                  flexShrink: 0
                }}>
                  <BookOpen size={30} />
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>{note.title}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--secondary-color)', fontWeight: '500', marginTop: '0.15rem' }}>
                        {note.subject} • Semester {note.semester}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <span className="badge badge-verified" style={{ fontSize: '0.7rem' }}>PDF</span>
                      <span className="badge badge-verified" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                        {note.fileSize}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{note.description}</p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--bg-border)', paddingTop: '0.75rem', marginTop: '0.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                      <span>By {note.uploaderName}</span>
                      {note.uploaderVerified && <span className="badge badge-verified" style={{ padding: '0.05rem 0.35rem', fontSize: '0.6rem' }}>Senior</span>}
                      <span>• {note.downloads || 0} downloads</span>
                    </div>

                    {/* Rating Widget */}
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            onClick={() => handleRateNote(note.id, star)}
                            style={{ 
                              cursor: 'pointer', 
                              color: star <= Math.round(note.rating) ? 'var(--warning-color)' : 'var(--text-dim)'
                            }}
                            fill={star <= Math.round(note.rating) ? 'var(--warning-color)' : 'none'}
                          />
                        ))}
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>
                          ({note.rating || 'N/A'})
                        </span>
                      </div>

                      <button 
                        onClick={() => handleFetchSummary(note)}
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', borderRadius: '4px', display: 'flex', gap: '0.25rem' }}
                      >
                        <Brain size={12} /> AI Summary
                      </button>

                      <button 
                        onClick={() => handleDownload(note.id)}
                        className="btn btn-primary"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', borderRadius: '4px', display: 'flex', gap: '0.25rem' }}
                      >
                        <Download size={12} /> Download
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Column: AI Assistant Study Widget */}
      <div>
        <div className="glass-panel" style={{ padding: '1.5rem', position: 'sticky', top: '2.5rem', background: 'linear-gradient(to bottom, rgba(99, 102, 241, 0.05), transparent)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary-color)' }}>
            <Brain size={22} /> AI Study Assistant
          </h2>
          
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '1.25rem' }}>
            Click the "AI Summary" button on any lecture note card to dynamically generate an AI-powered digest, key topics, and exam revision guides.
          </p>

          {summaryNoteId ? (
            <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', minHeight: '180px' }}>
              {aiLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '180px', gap: '0.75rem' }}>
                  <Loader className="spin" size={24} style={{ color: 'var(--secondary-color)' }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Analyzing contents...</span>
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                  {aiSummary}
                </p>
              )}
            </div>
          ) : (
            <div style={{ border: '1px dashed var(--bg-border)', borderRadius: 'var(--radius-sm)', padding: '2rem 1rem', textHeight: '1.5', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
              Select a notes PDF card using the "AI Summary" button to view analysis.
            </div>
          )}
        </div>
      </div>

      {/* Upload Notes Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-pop">
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Share Lecture Notes or Manual</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <FolderOpen size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateNote}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Notes Title / Topic</label>
                  <input
                    type="text"
                    placeholder="e.g. Unit 3 Trees & BST Traversal Notes"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Subject Course</label>
                    <input
                      type="text"
                      placeholder="e.g. Data Structures"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Semester</label>
                    <select
                      value={newSem}
                      onChange={(e) => setNewSem(e.target.value)}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Notes Summary Description</label>
                  <textarea
                    placeholder="Provide a description of topics covered, references, and class codes..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    required
                  />
                </div>

                <div style={{ 
                  border: '2px dashed var(--bg-border)', 
                  borderRadius: 'var(--radius-sm)', 
                  padding: '1.5rem', 
                  textAlign: 'center', 
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem'
                }}>
                  📎 Select PDF Notes File (drag & drop simulated)
                </div>
              </div>

              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--bg-border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Uploading...' : 'Publish & Share'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
