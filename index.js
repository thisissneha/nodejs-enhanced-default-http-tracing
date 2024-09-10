require('./tracing') // Load tracing file

const express = require('express');
const app = express();

// Middleware to parse incoming JSON requests
app.use(express.json());

// Sample in-memory data store (for demonstration purposes)
let users = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
];

// Root route (GET)
app.get('/', (req, res) => {
  res.send('Welcome to the Node.js API!');
});

// Get all users (GET)
app.get('/users', (req, res) => {
  res.json(users);
});

// Create a new user (POST)
app.post('/users', (req, res) => {
  const { name } = req.body;

  if (name) {
    const newUser = {
      id: users.length + 1,
      name,
    };

    users.push(newUser);
    res.status(201).json(newUser);
  } else {
    res.status(400).json({ error: 'Name is required' });
  }
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start the server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
