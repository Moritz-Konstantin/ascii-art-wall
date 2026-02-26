const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname)));

let artworks = [];
let nextId = 1;

function timestamp() {
  return new Date().toISOString();
}

app.get('/api/artworks', (req, res) => {
  const summary = artworks.slice().reverse().map(a => ({
    id: a.id, title: a.title, artist: a.artist, ascii_art: a.ascii_art,
    created_at: a.created_at, upvotes: a.upvotes, downvotes: a.downvotes,
    comment_count: a.comments.length
  }));
  res.json({ artworks: summary, total: summary.length });
});

app.post('/api/artworks', (req, res) => {
  const { title, artist, ascii_art, description } = req.body;
  if (!title || !artist || !ascii_art) {
    return res.status(400).json({ error: 'Missing required fields: title, artist, ascii_art' });
  }
  const artwork = {
    id: nextId++, title, artist, ascii_art, description: description || '',
    created_at: timestamp(), upvotes: 0, downvotes: 0, comments: []
  };
  artworks.push(artwork);
  res.status(201).json({ message: 'Artwork posted!', artwork });
});

app.get('/api/artworks/:id', (req, res) => {
  const artwork = artworks.find(a => a.id === parseInt(req.params.id));
  if (!artwork) return res.status(404).json({ error: 'Artwork not found' });
  res.json(artwork);
});

app.post('/api/artworks/:id/comments', (req, res) => {
  const artwork = artworks.find(a => a.id === parseInt(req.params.id));
  if (!artwork) return res.status(404).json({ error: 'Artwork not found' });
  const { author, text, is_guess } = req.body;
  if (!author || !text) {
    return res.status(400).json({ error: 'Missing required fields: author, text' });
  }
  const comment = {
    id: artwork.comments.length + 1, author, text,
    is_guess: is_guess || false, created_at: timestamp()
  };
  artwork.comments.push(comment);
  res.status(201).json({ message: 'Comment added!', comment });
});

app.post('/api/artworks/:id/vote', (req, res) => {
  const artwork = artworks.find(a => a.id === parseInt(req.params.id));
  if (!artwork) return res.status(404).json({ error: 'Artwork not found' });
  const { voter, direction } = req.body;
  const dir = (direction || '').toLowerCase().replace('vote', '');
  if (!voter || !['up', 'down'].includes(dir)) {
    return res.status(400).json({ error: 'Missing: voter, direction (up/down)' });
  }
  if (dir === 'up') artwork.upvotes += 1;
  else artwork.downvotes += 1;
  res.json({ message: 'Vote recorded!', artwork_id: artwork.id, upvotes: artwork.upvotes, downvotes: artwork.downvotes });
});

app.get('/api/stats', (req, res) => {
  const leaderboard = artworks.map(a => ({
    id: a.id, title: a.title, artist: a.artist,
    score: a.upvotes - a.downvotes, upvotes: a.upvotes, downvotes: a.downvotes,
    comment_count: a.comments.length
  })).sort((a, b) => b.score - a.score);
  res.json({ total_artworks: artworks.length, total_comments: artworks.reduce((s, a) => s + a.comments.length, 0), leaderboard });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('ASCII Art Wall running at http://0.0.0.0:' + PORT);
});
