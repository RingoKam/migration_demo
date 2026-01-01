const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Mock user data
const users = {
  '1': {
    id: '1',
    email: 'john.doe@example.com',
    username: 'johndoe',
    role: 'STUDENT'
  },
  '2': {
    id: '2',
    email: 'jane.smith@example.com',
    username: 'janesmith',
    role: 'TEACHER'
  },
  '3': {
    id: '3',
    email: 'admin@example.com',
    username: 'admin',
    role: 'ADMIN'
  }
};

// REST API endpoint: GET /users/:id
app.get('/users/:id', (req, res) => {
  const userId = req.params.id;
  const user = users[userId];

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user-service' });
});

app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});

