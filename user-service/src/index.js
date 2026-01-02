const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

app.use(cors());
app.use(express.json());

// Mock user data with plain text passwords
// In production, these would be stored in a database with proper hashing
// Default password for all demo users: "password123"
const users = {
  '1': {
    id: '1',
    email: 'john.doe@example.com',
    username: 'johndoe',
    role: 'STUDENT',
    password: 'password123'
  },
  '2': {
    id: '2',
    email: 'jane.smith@example.com',
    username: 'janesmith',
    role: 'TEACHER',
    password: 'password123'
  },
  '3': {
    id: '3',
    email: 'admin@example.com',
    username: 'admin',
    role: 'ADMIN',
    password: 'password123'
  }
};

// Helper to generate JWT token
function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Helper to find user by email
function findUserByEmail(email) {
  return Object.values(users).find(user => user.email === email);
}

// Helper to get next user ID
function getNextUserId() {
  const ids = Object.keys(users).map(id => parseInt(id));
  return Math.max(...ids, 0) + 1;
}

// REST API endpoint: GET /users/:id
app.get('/users/:id', (req, res) => {
  const userId = req.params.id;
  const user = users[userId];

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Don't return password
  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// Auth endpoint: POST /auth/login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login request received:', { email, password });

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('User found:', user);

    // Verify password (plain text comparison)
    if (password !== user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Auth endpoint: POST /auth/register
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, username, role = 'STUDENT' } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, password, and username are required' });
    }

    // Check if user already exists
    if (findUserByEmail(email)) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Create new user (store password as plain text for demo)
    const newId = getNextUserId().toString();
    const newUser = {
      id: newId,
      email,
      username,
      role: role.toUpperCase(),
      password
    };

    users[newId] = newUser;

    const token = generateToken(newUser);
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Auth endpoint: GET /auth/verify - Verify JWT token and return user info
app.get('/auth/verify', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: 'Invalid authorization header format' });
    }

    const token = parts[1];

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Find user by ID from token
    const user = users[decoded.userId];
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Return user info without password
    const { password, ...userWithoutPassword } = user;
    res.json({
      user: userWithoutPassword,
      isValid: true
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user-service' });
});

app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});

