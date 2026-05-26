import React, { useState } from 'react';
import { UserCheck, ShieldAlert, Sparkles, MessageSquare, Info, Shield } from 'lucide-react';

export default function Roommates({ data, user, onRefreshData, onOpenChat }) {
  const [editingProfile, setEditingProfile] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable habits
  const [sleeping, setSleeping] = useState(user?.habits?.sleeping || 'Moderate');
  const [lights, setLights] = useState(user?.habits?.lights || 'Lights Off');
  const [occupancy, setOccupancy] = useState(user?.habits?.occupancy || '2 Roommates');
  const [study, setStudy] = useState(user?.habits?.study || 'In Room');
  const [food, setFood] = useState(user?.habits?.food || 'Vegetarian');
  const [cleanliness, setCleanliness] = useState(user?.habits?.cleanliness || 'Moderate');
  const [bio, setBio] = useState(user?.habits?.bio || '');

  const calculateCompatibility = (habitsA, habitsB) => {
    if (!habitsA || !habitsB) return 0;
    
    let matches = 0;
    let totalFields = 6; // sleeping, lights, occupancy, study, food, cleanliness

    if (habitsA.sleeping === habitsB.sleeping) matches++;
    if (habitsA.lights === habitsB.lights) matches++;
    if (habitsA.occupancy === habitsB.occupancy) matches++;
    if (habitsA.study === habitsB.study) matches++;
    if (habitsA.food === habitsB.food) matches++;
    if (habitsA.cleanliness === habitsB.cleanliness) matches++;

    // No budget consideration for hostel-only college
    const percentage = Math.round((matches / totalFields) * 100);
    return percentage;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/roommates/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          habits: { sleeping, lights, occupancy, study, food, cleanliness, bio }
        })
      });
      const resData = await response.json();
      setSaving(false);
      
      if (resData.success) {
        setEditingProfile(false);
        onRefreshData();
      }
    } catch (err) {
      setSaving(false);
      console.error('Error saving roommate habits:', err);
    }
  };

  // Find matches among users who are NOT the current user
  const roommateList = data?.users?.filter(u => u.email.toLowerCase() !== user.email.toLowerCase()) || [];
  
  const matches = roommateList.map(otherUser => {
    const compScore = calculateCompatibility(user?.habits, otherUser?.habits);
    return {
      ...otherUser,
      compatibility: compScore
    };
  }).sort((a, b) => b.compatibility - a.compatibility);

  return (
    <div className="animate-fade" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
      {/* Matched Listings */}
      <div>
        <div className="section-header">
          <div>
            <h1 className="section-title">Roommate & PG Matcher</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Match based on sleeping schedules, food habits, and lifestyle preferences</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
          {matches.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No other roommate profiles registered on the campus yet. Keep sharing!
            </div>
          ) : (
            matches.map(match => (
              <div key={match.id} className="glass-panel animate-fade" style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                
                {/* Compatibility Circle */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                  <div className="compatibility-score">{match.compatibility}%</div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--secondary-color)', fontWeight: '700', textTransform: 'uppercase' }}>Match</span>
                </div>

                {/* Match Details */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{match.name}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        🎓 {match.college} • <span style={{ color: 'var(--primary-color)', fontWeight: '600' }}>Verified</span>
                      </p>
                    </div>

                    <button 
                      onClick={() => onOpenChat(match.email, match.name)}
                      className="btn btn-primary"
                      style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', borderRadius: '4px' }}
                    >
                      <MessageSquare size={14} /> Connect
                    </button>
                  </div>

                  {/* Habit tags */}
                  <div className="roommate-habits-summary">
                    <span className="roommate-habit-tag">🕒 {match.habits?.sleeping || 'Moderate'}</span>
                    <span className="roommate-habit-tag">💡 {match.habits?.lights || 'Lights Off'}</span>
                    <span className="roommate-habit-tag">🛏️ {match.habits?.occupancy || '2 Roommates'}</span>
                    <span className="roommate-habit-tag">📖 Study in {match.habits?.study || 'In Room'}</span>
                    <span className="roommate-habit-tag">🥗 {match.habits?.food || 'Vegetarian'}</span>
                    <span className="roommate-habit-tag">✨ {match.habits?.cleanliness || 'Moderate'} Clean</span>
                  </div>
                  {match.habits?.bio && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '4px', borderLeft: '2px solid var(--primary-color)' }}>
                      "{match.habits.bio}"
                    </div>
                  )}
                </div>

              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Column: User habits profile configuration */}
      <div>
        <div className="glass-panel" style={{ padding: '1.5rem', position: 'sticky', top: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} style={{ color: 'var(--secondary-color)' }} /> Your Lifestyle
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
            Define your living habits to calculate compatibility matches.
          </p>

          {!editingProfile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Sleeping Schedule:</span>
                  <span style={{ fontWeight: '600' }}>{user?.habits?.sleeping || 'Moderate'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Comfortability:</span>
                  <span style={{ fontWeight: '600' }}>{user?.habits?.lights || 'Lights Off'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Accommodation:</span>
                  <span style={{ fontWeight: '600' }}>{user?.habits?.occupancy || '2 Roommates'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Study Habits:</span>
                  <span style={{ fontWeight: '600' }}>{user?.habits?.study || 'In Room'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Food Preferences:</span>
                  <span style={{ fontWeight: '600' }}>{user?.habits?.food || 'Vegetarian'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Cleanliness Level:</span>
                  <span style={{ fontWeight: '600' }}>{user?.habits?.cleanliness || 'Moderate'}</span>
                </div>
                {user?.habits?.bio && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    "{user.habits.bio}"
                  </div>
                )}
              </div>

              <button className="btn btn-secondary" onClick={() => setEditingProfile(true)}>
                Edit Habits
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile}>
              <div className="form-group">
                <label>Sleeping Schedule</label>
                <select value={sleeping} onChange={(e) => setSleeping(e.target.value)}>
                  <option value="Early Bird">Early Bird (Morning)</option>
                  <option value="Night Owl">Night Owl (Late night)</option>
                  <option value="Moderate">Moderate / Variable</option>
                </select>
              </div>

              <div className="form-group">
                <label>Comfortability (Lights)</label>
                <select value={lights} onChange={(e) => setLights(e.target.value)}>
                  <option value="Lights Off">Prefer Lights Off</option>
                  <option value="Lights On">Can Sleep with Lights On</option>
                  <option value="Dim Lights">Dim Lights Only</option>
                </select>
              </div>

              <div className="form-group">
                <label>Accommodation Preference</label>
                <select value={occupancy} onChange={(e) => setOccupancy(e.target.value)}>
                  <option value="1 Roommate">1 Roommate (2 sharing)</option>
                  <option value="2 Roommates">2 Roommates (3 sharing)</option>
                  <option value="3+ Roommates">3+ Roommates (4+ sharing)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Study Environment</label>
                <select value={study} onChange={(e) => setStudy(e.target.value)}>
                  <option value="In Room">Study in Room</option>
                  <option value="Library">Library Goer</option>
                  <option value="Study Room">Hostel Common Room</option>
                </select>
              </div>

              <div className="form-group">
                <label>Food Choice</label>
                <select value={food} onChange={(e) => setFood(e.target.value)}>
                  <option value="Vegetarian">Pure Vegetarian</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                </select>
              </div>

              <div className="form-group">
                <label>Cleanliness</label>
                <select value={cleanliness} onChange={(e) => setCleanliness(e.target.value)}>
                  <option value="Very Clean">Very Clean / Organised</option>
                  <option value="Moderate">Moderate / Normal</option>
                  <option value="Messy">Messy / Carefree</option>
                </select>
              </div>

              <div className="form-group">
                <label>Intro / About Me</label>
                <textarea 
                  placeholder="E.g., I'm a CS student who likes quiet nights, mostly working on personal projects..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  style={{ minHeight: '80px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditingProfile(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
