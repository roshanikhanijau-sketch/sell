import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const dbPath = path.join(__dirname, 'db.json');

// Helper to read database
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

// Helper to write database
function writeDB(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing database file:', err);
  }
}

// Ensure database is valid on startup
let db = readDB();

// ----------------------------------------------------
// Global Data Fetch
// ----------------------------------------------------
app.get('/api/data', (req, res) => {
  db = readDB();
  res.json(db);
});

// ----------------------------------------------------
// Auth Routes
// ----------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  db = readDB();
  let user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    // Auto-signup if verified domains
    const isEdu = email.endsWith('.edu') || email.includes('@college.') || email.includes('@uni.');
    const name = email.split('@')[0].split('.').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' ');
    
    user = {
      id: email,
      email: email,
      name: name,
      college: isEdu ? 'University of Applied Sciences' : 'STU Campus',
      verified: true,
      badge: 'Student',
      habits: {
        sleeping: 'Moderate',
        lights: 'Lights Off',
        occupancy: '2 Roommates',
        study: 'In Room',
        food: 'Vegetarian',
        cleanliness: 'Moderate',
        bio: ''
      }
    };
    db.users.push(user);
    writeDB(db);
  }
  
  res.json({ success: true, user });
});

app.delete('/api/auth/profile/:email', (req, res) => {
  const { email } = req.params;
  db = readDB();
  db.users = db.users.filter(u => u.email.toLowerCase() !== email.toLowerCase());
  // Basic cascade cleanup
  db.items = db.items.filter(i => i.sellerEmail.toLowerCase() !== email.toLowerCase());
  writeDB(db);
  res.json({ success: true });
});

// ----------------------------------------------------
// Marketplace Routes
// ----------------------------------------------------
app.post('/api/items', (req, res) => {
  const { title, price, description, category, sellerEmail, sellerName } = req.body;
  if (!title || !price || !category || !sellerEmail) {
    return res.status(400).json({ error: 'Missing required item details' });
  }

  db = readDB();
  const newItem = {
    id: 'item-' + Date.now(),
    title,
    price: Number(price),
    description: description || '',
    category,
    image: category.toLowerCase(), // frontend will map this to a beautiful illustration
    sellerId: sellerEmail,
    sellerName: sellerName || sellerEmail.split('@')[0],
    sellerEmail: sellerEmail,
    sellerVerified: true,
    createdAt: new Date().toISOString()
  };

  db.items.unshift(newItem);
  writeDB(db);
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

  db = readDB();
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

  db.notes.unshift(newNote);
  writeDB(db);
  res.json({ success: true, note: newNote });
});

app.post('/api/notes/:id/download', (req, res) => {
  const { id } = req.params;
  db = readDB();
  const note = db.notes.find(n => n.id === id);
  if (note) {
    note.downloads = (note.downloads || 0) + 1;
    writeDB(db);
    return res.json({ success: true, downloads: note.downloads });
  }
  res.status(404).json({ error: 'Note not found' });
});

app.post('/api/notes/:id/rate', (req, res) => {
  const { id } = req.params;
  const { rating } = req.body; // number 1-5
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Invalid rating' });
  }

  db = readDB();
  const note = db.notes.find(n => n.id === id);
  if (note) {
    const prevCount = note.ratingsCount || 0;
    const prevRating = note.rating || 0;
    note.ratingsCount = prevCount + 1;
    note.rating = Number(((prevRating * prevCount + rating) / (prevCount + 1)).toFixed(1));
    writeDB(db);
    return res.json({ success: true, rating: note.rating, ratingsCount: note.ratingsCount });
  }
  res.status(404).json({ error: 'Note not found' });
});

app.post('/api/notes/summarize', (req, res) => {
  const { title, description } = req.body;
  // Simulated AI Summarization
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

  db = readDB();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (user) {
    user.habits = habits;
    writeDB(db);
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

  db = readDB();
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

  db.lostFound.unshift(newPost);
  writeDB(db);
  res.json({ success: true, post: newPost });
});

app.post('/api/lostfound/:id/claim', (req, res) => {
  const { id } = req.params;
  db = readDB();
  const post = db.lostFound.find(p => p.id === id);
  if (post) {
    post.status = 'claimed';
    writeDB(db);
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

  db = readDB();
  const event = db.events.find(e => e.id === id);
  if (event) {
    if (!event.rsvps) event.rsvps = [];
    const index = event.rsvps.indexOf(email);
    if (index === -1) {
      event.rsvps.push(email);
    } else {
      event.rsvps.splice(index, 1);
    }
    writeDB(db);
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

  db = readDB();
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

  db.feed.unshift(newPost);
  writeDB(db);
  res.json({ success: true, post: newPost });
});

app.post('/api/feed/:id/like', (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  db = readDB();
  const post = db.feed.find(p => p.id === id);
  if (post) {
    if (!post.likes) post.likes = [];
    const index = post.likes.indexOf(email);
    if (index === -1) {
      post.likes.push(email);
    } else {
      post.likes.splice(index, 1);
    }
    writeDB(db);
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

  db = readDB();
  const post = db.feed.find(p => p.id === id);
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
    writeDB(db);
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

  db = readDB();
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

  db.services.unshift(newService);
  writeDB(db);
  res.json({ success: true, service: newService });
});

// ----------------------------------------------------
// Chat Routes
// ----------------------------------------------------
app.get('/api/chats/:email1/:email2', (req, res) => {
  const { email1, email2 } = req.params;
  const chatId = [email1.toLowerCase(), email2.toLowerCase()].sort().join(':');
  
  db = readDB();
  const chat = db.chats.find(c => c.id === chatId);
  
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
  
  db = readDB();
  let chat = db.chats.find(c => c.id === chatId);
  
  if (!chat) {
    chat = { id: chatId, messages: [] };
    db.chats.push(chat);
  }
  
  const newMessage = {
    sender,
    text,
    timestamp: new Date().toISOString()
  };
  
  chat.messages.push(newMessage);
  writeDB(db);
  
  // Simulated auto-reply from Sophia Chen or Alex Johnson to make chat interactive!
  if (recipient.includes('@college.edu')) {
    setTimeout(() => {
      const refreshedDB = readDB();
      const directChat = refreshedDB.chats.find(c => c.id === chatId);
      if (directChat) {
        let replyText = "Hey! Let me double check and get back to you soon. Can we meet near the library?";
        if (text.toLowerCase().includes('calculator')) {
          replyText = "Sure, I have it ready. Standard price is 850, but I can do 800 for quick pickup!";
        } else if (text.toLowerCase().includes('roommate')) {
          replyText = "Awesome, let's grab coffee tomorrow at the food court to see if we match!";
        } else if (text.toLowerCase().includes('math') || text.toLowerCase().includes('book')) {
          replyText = "Yeah, the book is available. Very clean pages. Let me know when you want to collect it.";
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

// Start Server
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
