const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { readUsers, writeUsers } = require('./data.js');
const kafkaProducer = require('./kafka-producer.js');
const kafkaConsumer = require('./kafka-consumer.js');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

app.use(cors());
app.use(express.json());

// Helper to generate JWT token
function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Helper to find user by email
async function findUserByEmail(email) {
  const users = await readUsers();
  return Object.values(users).find(user => user.email === email);
}

// REST API endpoint: GET /users/:id
app.get('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const users = await readUsers();
    const user = users[userId];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't return password
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error reading user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Auth endpoint: POST /auth/login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login request received:', { email, password });

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await findUserByEmail(email);
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

    // Read current users from file
    const users = await readUsers();

    // Check if user already exists
    if (await findUserByEmail(email)) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Create new user (store password as plain text for demo)
    const ids = Object.keys(users).map(id => parseInt(id));
    const newId = (Math.max(...ids, 0) + 1).toString();
    const newUser = {
      id: newId,
      email,
      username,
      role: role.toUpperCase(),
      password
    };

    // Add new user and persist to file
    users[newId] = newUser;
    await writeUsers(users);

    // Publish USER_CREATED event to Kafka
    try {
      await kafkaProducer.publishEvent(
        'USER_CREATED',
        newId,
        {
          id: newId,
          email: newUser.email,
          username: newUser.username,
          role: newUser.role
        }
      );
    } catch (error) {
      console.error('Failed to publish user created event:', error);
      // Don't fail the request if Kafka publish fails
      // but this should be audited later on by developer and backfill missing data
    }

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
app.get('/auth/verify', async (req, res) => {
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

    // Read users from file and find user by ID from token
    const users = await readUsers();
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

// Start server
app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
  console.log('Reading data from file on each request');
  
  // Start Kafka consumer on startup
  kafkaConsumer.connect().catch(error => {
    console.error('Failed to start Kafka consumer:', error);
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await kafkaConsumer.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await kafkaConsumer.disconnect();
  process.exit(0);
});

