require('dotenv').config();

const express = require('express');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcrypt');
const path = require('path');
const cors = require('cors');
const User = require('./models/User');



const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET is missing in .env');

const PORT = process.env.PORT || 8081;
const app  = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '../client')));
app.get('/', (req, res) => {res.sendFile(path.join(__dirname, '../client/pages/login.html'));
})
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/signup.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/login.html'));
});

const users = []; 


app.post('/signup', async (req, res) => {
  const username= req.body.username;
  const password = req.body.password;
  // const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username or password is required' });
  if (users.some(u => u.username === username))
    return res.status(409).json({ error: 'Username already exists' });
  const hashed = await bcrypt.hash(password, 10);
  users.push({ username, password: hashed });
  res.status(201).json({ message: 'Signup successful' });

});


app.post('/login', async (req, res) => {
  const username= req.body.username;
  const password = req.body.password;
  const user = users.find(u => u.username === username);
  if (!user) return res.status(400).json({ error: 'Wrong credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ error: 'Wrong credentials' });
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ token });

});
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Missing token' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Malformed token' });

  const decoded = jwt.verify(token, JWT_SECRET);
  if (!decoded.username) return res.status(401).json({ message: 'Invalid token' });

  req.username = decoded.username;
  next();
}



app.get('/me', auth, (req, res) => {
  const user = users.find(u => u.username === req.username);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ username: user.username });
});




app.post('/upload', auth, function (req, res) {
  const article=req.body.article;
  const description= req.body.description;
  const file=req.body.file;
  res.json({ article: article, description: description });


})

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});



app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
