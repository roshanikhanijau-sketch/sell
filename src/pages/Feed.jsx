import React, { useState } from 'react';
import { MessageSquare, Heart, Send, ShieldAlert, User, Check } from 'lucide-react';

export default function Feed({ data, user, onRefreshData }) {
  const [activeTag, setActiveTag] = useState('All');
  const [postType, setPostType] = useState('general');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedTag, setSelectedTag] = useState('General');
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [teacherRating, setTeacherRating] = useState(80);
  const [teachingBehavior, setTeachingBehavior] = useState(70);
  
  // For comment inputs
  const [commentInputs, setCommentInputs] = useState({}); // { [postId]: string }
  const [anonymousComments, setAnonymousComments] = useState({}); // { [postId]: boolean }

  const tags = ['All', 'General', 'Academics', 'Hostel', 'Complaints', 'Exams', 'DSA'];

  const filteredFeed = data?.feed?.filter(post => {
    if (activeTag === 'All') return true;
    return post.tags?.some(tag => tag.toLowerCase() === activeTag.toLowerCase());
  }) || [];

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          authorEmail: user.email,
          authorName: user.name,
          anonymous: anonymous,
          tags: [selectedTag],
          postType: postType,
          teacherRating: teacherRating,
          teachingBehavior: teachingBehavior
        })
      });
      const resData = await response.json();
      setSubmitting(false);
      
      if (resData.success) {
        setNewTitle('');
        setNewContent('');
        setAnonymous(false);
        setPostType('general');
        setTeacherRating(80);
        setTeachingBehavior(70);
        onRefreshData();
      }
    } catch (err) {
      setSubmitting(false);
      console.error('Error creating post:', err);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const response = await fetch(`/api/feed/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      const resData = await response.json();
      if (resData.success) {
        onRefreshData();
      }
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    const content = commentInputs[postId];
    if (!content) return;

    const isAnon = !!anonymousComments[postId];

    try {
      const response = await fetch(`/api/feed/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          authorName: user.name,
          anonymous: isAnon
        })
      });
      const resData = await response.json();
      if (resData.success) {
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        onRefreshData();
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  return (
    <div className="animate-fade" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
      {/* Feed List */}
      <div>
        <div className="section-header" style={{ marginBottom: '1.25rem' }}>
          <h1 className="section-title">Community Feed</h1>
        </div>

        {/* Tags Selector */}
        <div className="semester-chips" style={{ marginBottom: '1.5rem' }}>
          {tags.map(tag => (
            <button
              key={tag}
              className={`semester-chip ${activeTag === tag ? 'active' : ''}`}
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Feed Posts */}
        {filteredFeed.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No posts found under this category. Be the first to write something!
          </div>
        ) : (
          filteredFeed.map(post => {
            const hasLiked = post.likes?.includes(user.email);
            return (
              <div key={post.id} className="glass-panel feed-post-card animate-fade">
                <div className="feed-header">
                  <div className="feed-meta">
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      background: post.anonymous ? 'var(--gradient-coral)' : 'var(--gradient-brand)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      color: 'white'
                    }}>
                      {post.anonymous ? '👤' : post.authorName.charAt(0)}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{post.authorName}</span>
                        {post.anonymous && (
                          <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            Anonymous
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="feed-tags">
                    {post.tags?.map((t, idx) => (
                      <span key={idx} className="feed-tag">{t}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                    {post.postType === 'teacher_review' ? '👨‍🏫 Review: ' : ''}{post.title}
                  </h3>
                  
                  {post.postType === 'teacher_review' && (
                    <div style={{ marginBottom: '1.25rem', padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: '600' }}>
                          <span>Overall Teacher Rating</span>
                          <span>{post.teacherRating}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'var(--bg-border)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${post.teacherRating}%`, height: '100%', background: 'var(--gradient-emerald)', borderRadius: '4px' }} />
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: '600' }}>
                          <span>Teaching Behavior & Strictness</span>
                          <span>{post.teachingBehavior}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'var(--bg-border)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${post.teachingBehavior}%`, height: '100%', background: 'var(--gradient-cyan)', borderRadius: '4px' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                    {post.content}
                  </p>
                </div>

                {/* Like / Comment Actions */}
                <div className="feed-actions">
                  <button 
                    onClick={() => handleLikePost(post.id)}
                    className={`feed-action-btn ${hasLiked ? 'active' : ''}`}
                    style={{ color: hasLiked ? 'var(--danger-color)' : 'var(--text-muted)' }}
                  >
                    <Heart size={16} fill={hasLiked ? 'var(--danger-color)' : 'none'} />
                    <span>{post.likes?.length || 0} Likes</span>
                  </button>

                  <div className="feed-action-btn">
                    <MessageSquare size={16} />
                    <span>{post.comments?.length || 0} Comments</span>
                  </div>
                </div>

                {/* Comment List */}
                {post.comments && post.comments.length > 0 && (
                  <div className="comments-section">
                    {post.comments.map(comment => (
                      <div key={comment.id} className="comment-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="comment-author">
                            {comment.authorName}
                            {comment.anonymous && (
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginLeft: '0.25rem' }}>(Anon)</span>
                            )}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="comment-body">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment Form */}
                <form 
                  onSubmit={(e) => handleAddComment(e, post.id)} 
                  style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}
                >
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={commentInputs[post.id] || ''}
                    onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                    style={{ flex: 1, padding: '0.6rem 0.9rem', fontSize: '0.85rem' }}
                    required
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <label 
                      htmlFor={`anon-comment-${post.id}`} 
                      style={{ fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.15rem' }}
                    >
                      <input
                        type="checkbox"
                        id={`anon-comment-${post.id}`}
                        checked={!!anonymousComments[post.id]}
                        onChange={(e) => setAnonymousComments({ ...anonymousComments, [post.id]: e.target.checked })}
                        style={{ width: 'auto', marginRight: '0.2rem' }}
                      />
                      Anon
                    </label>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem' }}>
                    <Send size={14} />
                  </button>
                </form>
              </div>
            )
          })
        )}
      </div>

      {/* Right Column: Write a Post */}
      <div>
        <div className="glass-panel" style={{ padding: '1.5rem', position: 'sticky', top: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.25rem' }}>Create Discussion</h2>
          
          <form onSubmit={handleCreatePost}>
            <div className="form-group">
              <label>Post Type</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" onClick={() => setPostType('general')} className={`btn ${postType === 'general' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '0.5rem' }}>General</button>
                <button type="button" onClick={() => setPostType('teacher_review')} className={`btn ${postType === 'teacher_review' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '0.5rem' }}>Teacher Review</button>
              </div>
            </div>

            <div className="form-group">
              <label>{postType === 'teacher_review' ? 'Teacher Name & Subject' : 'Title'}</label>
              <input
                type="text"
                placeholder={postType === 'teacher_review' ? "e.g., Dr. Sharma - Linear Algebra" : "What is on your mind?"}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
            </div>

            {postType === 'teacher_review' && (
              <>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Overall Rating</span>
                    <span style={{ color: 'var(--primary-color)' }}>{teacherRating}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={teacherRating}
                    onChange={(e) => setTeacherRating(Number(e.target.value))}
                    className="rating-slider slider-primary"
                    style={{
                      background: `linear-gradient(to right, var(--primary-color) ${teacherRating}%, var(--bg-border) ${teacherRating}%)`
                    }}
                  />
                </div>
                
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Behavior & Teaching Style</span>
                    <span style={{ color: 'var(--secondary-color)' }}>{teachingBehavior}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={teachingBehavior}
                    onChange={(e) => setTeachingBehavior(Number(e.target.value))}
                    className="rating-slider slider-secondary"
                    style={{
                      background: `linear-gradient(to right, var(--secondary-color) ${teachingBehavior}%, var(--bg-border) ${teachingBehavior}%)`
                    }}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Topic Tag</label>
              <select 
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
              >
                <option value="General">General</option>
                <option value="Academics">Academics</option>
                <option value="Hostel">Hostel</option>
                <option value="Complaints">Complaints</option>
                <option value="Exams">Exams</option>
                <option value="DSA">Data Structures</option>
              </select>
            </div>

            <div className="form-group">
              <label>Content</label>
              <textarea
                placeholder="Share course reviews, ask syllabus doubts, or post general complaints..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input
                type="checkbox"
                id="anon-post"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                style={{ width: 'auto', cursor: 'pointer' }}
              />
              <label htmlFor="anon-post" style={{ cursor: 'pointer', fontSize: '0.8rem', userSelect: 'none' }}>
                Post Anonymously
              </label>
            </div>

            {anonymous && (
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                background: 'rgba(245, 158, 11, 0.08)', 
                border: '1px solid var(--warning-color)', 
                padding: '0.75rem', 
                borderRadius: 'var(--radius-sm)', 
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginBottom: '1rem',
                lineHeight: '1.4'
              }}>
                <ShieldAlert size={18} style={{ color: 'var(--warning-color)', flexShrink: 0 }} />
                <span>Your name and email will be hidden. Admins can flag abusive content, please keep it constructive.</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? 'Posting...' : 'Publish Post'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
