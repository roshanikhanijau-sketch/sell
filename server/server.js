import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { openDb } from './db.js'; // SQLite helper for auth

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static frontend files from the 'dist' directory (for production/Railway)
app.use(express.static(path.join(__dirname, '../dist')));
// ----------------------------------------------------
// File-based DB helpers (for Marketplace, Notes, etc.)
// ----------------------------------------------------
const dbPath = path.join(__dirname, 'db.json');

function readDB() {
  try {
    if (!fs.existsSync(dbPath)) {
      return { users: [], items: [], notes: [], lostFound: [], events: [], feed: [], services: [], chats: [] };
    }
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database file:', err);
    return { users: [], items: [], notes: [], lostFound: [], events: [], feed: [], services: [], chats: [] };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing database file:', err);
  }
}

// OTP helper
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ----------------------------------------------------
// Global Data Fetch
// ----------------------------------------------------
app.get('/api/data', (req, res) => {
  const fileDb = readDB();
  res.json(fileDb);
});

// ----------------------------------------------------
// Auth Routes (SQLite + OTP)
// ----------------------------------------------------

// POST /api/auth/login  — sends OTP (new user auto-registered)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, collegeId } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const sqlDb = await openDb();
    const user = await sqlDb.get('SELECT * FROM users WHERE email = ?', email.toLowerCase());

    // Strip .edu suffix from provided collegeId if present
    let college = collegeId ? collegeId.replace(/\.edu$/i, '') : null;

    if (!user) {
      // Auto-register new user
      const name = email.split('@')[0].split('.').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' ');
      if (!college) {
        college = 'STU Campus';
      }
      const otp = generateOTP();
      const expires = Date.now() + 5 * 60 * 1000; // 5 minutes
      await sqlDb.run(
        'INSERT INTO users (email, name, college_id, verified, otp, otp_expires) VALUES (?,?,?,0,?,?)',
        email.toLowerCase(), name, college, otp, expires
      );
      console.log(`[OTP] New user ${email} → OTP: ${otp}`);
      return res.json({ success: true, message: 'OTP sent to email', otp }); // otp returned for dev/testing
    }

    // Existing user — generate new OTP
    const otp = generateOTP();
    const expires = Date.now() + 5 * 60 * 1000;
    await sqlDb.run('UPDATE users SET otp = ?, otp_expires = ? WHERE email = ?', otp, expires, email.toLowerCase());
    console.log(`[OTP] Existing user ${email} → OTP: ${otp}`);
    res.json({ success: true, message: 'OTP sent to email', otp }); // otp returned for dev/testing
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// POST /api/auth/verify-otp
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }
    const sqlDb = await openDb();
    const user = await sqlDb.get('SELECT * FROM users WHERE email = ?', email.toLowerCase());
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.otp !== otp || Date.now() > user.otp_expires) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    await sqlDb.run(
      'UPDATE users SET verified = 1, otp = NULL, otp_expires = NULL WHERE email = ?',
      email.toLowerCase()
    );
    const { otp: _o, otp_expires: _e, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (err) {
    console.error('OTP verify error:', err);
    res.status(500).json({ error: 'Server error during OTP verification' });
  }
});

// DELETE /api/auth/profile/:email
app.delete('/api/auth/profile/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const sqlDb = await openDb();
    await sqlDb.run('DELETE FROM users WHERE email = ?', email.toLowerCase());
    // Cascade cleanup for items in file db
    const fileDb = readDB();
    fileDb.items = fileDb.items.filter(i => i.sellerEmail.toLowerCase() !== email.toLowerCase());
    writeDB(fileDb);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ----------------------------------------------------
// Marketplace Routes
// ----------------------------------------------------
app.post('/api/items', (req, res) => {
  const { title, price, description, category, sellerEmail, sellerName } = req.body;
  if (!title || !price || !category || !sellerEmail) {
    return res.status(400).json({ error: 'Missing required item details' });
  }

  const fileDb = readDB();
  const newItem = {
    id: 'item-' + Date.now(),
    title,
    price: Number(price),
    description: description || '',
    category,
    image: category.toLowerCase(),
    sellerId: sellerEmail,
    sellerName: sellerName || sellerEmail.split('@')[0],
    sellerEmail: sellerEmail,
    sellerVerified: true,
    createdAt: new Date().toISOString()
  };

  fileDb.items.unshift(newItem);
  writeDB(fileDb);
  res.json({ success: true, item: newItem });
});

// ----------------------------------------------------
// Notes Routes
// ----------------------------------------------------
app.post('/api/notes', (req, res) => {
  const { title, subject, semester, description, uploaderEmail, uploaderName } = req.body;
  if (!title || !subject || !semester || !uploaderEmail) {
    return res.status(400).json({ error: 'Missing required note details' });
  }

  const fileDb = readDB();
  const newNote = {
    id: 'note-' + Date.now(),
    title,
    subject,
    semester: Number(semester),
    description: description || '',
    fileSize: (Math.random() * (8.5 - 1.2) + 1.2).toFixed(1) + ' MB',
    downloads: 0,
    rating: 0,
    ratingsCount: 0,
    uploaderId: uploaderEmail,
    uploaderName: uploaderName || uploaderEmail.split('@')[0],
    uploaderVerified: true,
    createdAt: new Date().toISOString()
  };

  fileDb.notes.unshift(newNote);
  writeDB(fileDb);
  res.json({ success: true, note: newNote });
});

app.post('/api/notes/:id/download', (req, res) => {
  const { id } = req.params;
  const fileDb = readDB();
  const note = fileDb.notes.find(n => n.id === id);
  if (note) {
    note.downloads = (note.downloads || 0) + 1;
    writeDB(fileDb);
    return res.json({ success: true, downloads: note.downloads });
  }
  res.status(404).json({ error: 'Note not found' });
});

app.post('/api/notes/:id/rate', (req, res) => {
  const { id } = req.params;
  const { rating } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Invalid rating' });
  }

  const fileDb = readDB();
  const note = fileDb.notes.find(n => n.id === id);
  if (note) {
    const prevCount = note.ratingsCount || 0;
    const prevRating = note.rating || 0;
    note.ratingsCount = prevCount + 1;
    note.rating = Number(((prevRating * prevCount + rating) / (prevCount + 1)).toFixed(1));
    writeDB(fileDb);
    return res.json({ success: true, rating: note.rating, ratingsCount: note.ratingsCount });
  }
  res.status(404).json({ error: 'Note not found' });
});

app.post('/api/notes/summarize', (req, res) => {
  const { title, description } = req.body;
  const summary = `
📝 **AI Note Summary: ${title || 'Notes'}**

Key Topics Extracted:
• Primary Concept: ${description ? description.slice(0, 50) + '...' : 'General academic coursework guidelines and references.'}
• Topic Core: Understanding formulas, structures, and implementation methodologies relevant to the subject.
• Examination Focus: Highly recommended for end-semester exams, lab quizzes, and quick revision of solved numericals.

💡 *Study Tip:* Combine these notes with standard textbook reference formulas for maximum retention.
  `.trim();
  res.json({ success: true, summary });
});

// ----------------------------------------------------
// Roommate Matching Route
// ----------------------------------------------------
app.post('/api/roommates/profile', (req, res) => {
  const { email, habits } = req.body;
  if (!email || !habits) {
    return res.status(400).json({ error: 'Missing email or habits profile' });
  }

  const fileDb = readDB();
  const user = fileDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (user) {
    user.habits = habits;
    writeDB(fileDb);
    res.json({ success: true, user });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// ----------------------------------------------------
// Lost & Found Routes
// ----------------------------------------------------
app.post('/api/lostfound', (req, res) => {
  const { type, title, location, description, reporterEmail, reporterName } = req.body;
  if (!type || !title || !location || !reporterEmail) {
    return res.status(400).json({ error: 'Missing required lost & found details' });
  }

  const fileDb = readDB();
  const newPost = {
    id: 'lf-' + Date.now(),
    type,
    title,
    location,
    description: description || '',
    image: type === 'lost' ? 'lost_item' : 'found_item',
    reporterName: reporterName || reporterEmail.split('@')[0],
    reporterEmail: reporterEmail,
    createdAt: new Date().toISOString(),
    status: 'open'
  };

  fileDb.lostFound.unshift(newPost);
  writeDB(fileDb);
  res.json({ success: true, post: newPost });
});

app.post('/api/lostfound/:id/claim', (req, res) => {
  const { id } = req.params;
  const fileDb = readDB();
  const post = fileDb.lostFound.find(p => p.id === id);
  if (post) {
    post.status = 'claimed';
    writeDB(fileDb);
    return res.json({ success: true, post });
  }
  res.status(404).json({ error: 'Post not found' });
});

// ----------------------------------------------------
// Event Routes
// ----------------------------------------------------
app.post('/api/events/:id/rsvp', (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const fileDb = readDB();
  const event = fileDb.events.find(e => e.id === id);
  if (event) {
    if (!event.rsvps) event.rsvps = [];
    const index = event.rsvps.indexOf(email);
    if (index === -1) {
      event.rsvps.push(email);
    } else {
      event.rsvps.splice(index, 1);
    }
    writeDB(fileDb);
    return res.json({ success: true, rsvps: event.rsvps });
  }
  res.status(404).json({ error: 'Event not found' });
});

// ----------------------------------------------------
// Feed Routes
// ----------------------------------------------------
app.post('/api/feed', (req, res) => {
  const { title, content, authorEmail, authorName, anonymous, tags, postType, teacherRating, teachingBehavior } = req.body;
  if (!title || !content || !authorEmail) {
    return res.status(400).json({ error: 'Missing required post fields' });
  }

  const fileDb = readDB();
  const newPost = {
    id: 'post-' + Date.now(),
    postType: postType || 'general',
    title,
    content,
    teacherRating: postType === 'teacher_review' ? Number(teacherRating) : undefined,
    teachingBehavior: postType === 'teacher_review' ? Number(teachingBehavior) : undefined,
    authorId: authorEmail,
    authorName: anonymous ? 'Anonymous Student' : (authorName || authorEmail.split('@')[0]),
    anonymous: !!anonymous,
    likes: [],
    comments: [],
    tags: tags || ['General'],
    createdAt: new Date().toISOString()
  };

  fileDb.feed.unshift(newPost);
  writeDB(fileDb);
  res.json({ success: true, post: newPost });
});

app.post('/api/feed/:id/like', (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const fileDb = readDB();
  const post = fileDb.feed.find(p => p.id === id);
  if (post) {
    if (!post.likes) post.likes = [];
    const index = post.likes.indexOf(email);
    if (index === -1) {
      post.likes.push(email);
    } else {
      post.likes.splice(index, 1);
    }
    writeDB(fileDb);
    return res.json({ success: true, likes: post.likes });
  }
  res.status(404).json({ error: 'Post not found' });
});

app.post('/api/feed/:id/comment', (req, res) => {
  const { id } = req.params;
  const { content, authorName, anonymous } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Comment content is required' });
  }

  const fileDb = readDB();
  const post = fileDb.feed.find(p => p.id === id);
  if (post) {
    const newComment = {
      id: 'comment-' + Date.now(),
      authorName: anonymous ? 'Anonymous Student' : (authorName || 'Student'),
      anonymous: !!anonymous,
      content,
      createdAt: new Date().toISOString()
    };
    if (!post.comments) post.comments = [];
    post.comments.push(newComment);
    writeDB(fileDb);
    return res.json({ success: true, comments: post.comments });
  }
  res.status(404).json({ error: 'Post not found' });
});

// ----------------------------------------------------
// Student Services Routes
// ----------------------------------------------------
app.post('/api/services', (req, res) => {
  const { title, price, category, description, providerEmail, providerName } = req.body;
  if (!title || !price || !category || !providerEmail) {
    return res.status(400).json({ error: 'Missing required service fields' });
  }

  const fileDb = readDB();
  const newService = {
    id: 'service-' + Date.now(),
    title,
    providerName: providerName || providerEmail.split('@')[0],
    providerEmail,
    category,
    price,
    description: description || '',
    rating: 5.0
  };

  fileDb.services.unshift(newService);
  writeDB(fileDb);
  res.json({ success: true, service: newService });
});

// ----------------------------------------------------
// Chat Routes
// ----------------------------------------------------
app.get('/api/chats/:email1/:email2', (req, res) => {
  const { email1, email2 } = req.params;
  const chatId = [email1.toLowerCase(), email2.toLowerCase()].sort().join(':');

  const fileDb = readDB();
  const chat = fileDb.chats.find(c => c.id === chatId);

  if (chat) {
    res.json(chat.messages);
  } else {
    res.json([]);
  }
});

app.post('/api/chats/message', (req, res) => {
  const { sender, recipient, text } = req.body;
  if (!sender || !recipient || !text) {
    return res.status(400).json({ error: 'Missing message details' });
  }

  const chatId = [sender.toLowerCase(), recipient.toLowerCase()].sort().join(':');

  const fileDb = readDB();
  let chat = fileDb.chats.find(c => c.id === chatId);

  if (!chat) {
    chat = { id: chatId, messages: [] };
    fileDb.chats.push(chat);
  }

  const newMessage = {
    sender,
    text,
    timestamp: new Date().toISOString()
  };

  chat.messages.push(newMessage);
  writeDB(fileDb);

  // Simulated auto-reply
  if (recipient.includes('@college.edu')) {
    setTimeout(() => {
      const refreshedDB = readDB();
      const directChat = refreshedDB.chats.find(c => c.id === chatId);
      if (directChat) {
        let replyText = 'Hey! Let me double check and get back to you soon. Can we meet near the library?';
        if (text.toLowerCase().includes('calculator')) {
          replyText = 'Sure, I have it ready. Standard price is 850, but I can do 800 for quick pickup!';
        } else if (text.toLowerCase().includes('roommate')) {
          replyText = "Awesome, let's grab coffee tomorrow at the food court to see if we match!";
        } else if (text.toLowerCase().includes('math') || text.toLowerCase().includes('book')) {
          replyText = 'Yeah, the book is available. Very clean pages. Let me know when you want to collect it.';
        }

        directChat.messages.push({
          sender: recipient,
          text: replyText,
          timestamp: new Date().toISOString()
        });
        writeDB(refreshedDB);
      }
    }, 2000);
  }

  res.json({ success: true, message: newMessage });
});
// Catch-all route for React Router (must be placed after all API routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
