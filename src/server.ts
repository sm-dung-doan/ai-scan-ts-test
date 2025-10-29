import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import { encrypt, validateSession } from './crypto';
import { 
  users, 
  products, 
  orders, 
  createOrder, 
  findUserByUsername, 
  findUserById, 
  findOrderById,
  User,
  Order
} from './database';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'VulnShop API - Intentionally Vulnerable for Security Testing',
    endpoints: {
      auth: {
        'POST /api/auth/login': 'Login with username and password',
        'GET /api/auth/me': 'Get current user info'
      },
      users: {
        'GET /api/users/:id': 'Get user profile (IDOR VULNERABLE!)'
      },
      products: {
        'GET /api/products': 'List all products'
      },
      orders: {
        'POST /api/orders': 'Create new order',
        'GET /api/orders/:id': 'Get order details (IDOR VULNERABLE!)',
        'POST /api/orders/:id/payment': 'Submit payment for order',
        'POST /api/orders/:id/confirm': 'Confirm order (LOGIC BUG: can skip payment!)'
      },
      admin: {
        'GET /api/admin/users': 'List all users (admin only, session manipulation possible!)'
      }
    }
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  const user = findUserByUsername(username);
  
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const sessionData = JSON.stringify({
    userId: user.id,
    isAdmin: user.isAdmin,
    timestamp: Date.now()
  });
  
  const encryptedSession = encrypt(sessionData);
  
  res.cookie('session', encryptedSession, { httpOnly: true });
  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin
    }
  });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const session = req.cookies.session;
  
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const validation = validateSession(session);
  
  if (!validation.valid) {
    return res.status(401).json({ error: validation.error });
  }
  
  const user = findUserById(validation.userId!);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    isAdmin: user.isAdmin
  });
});

app.get('/api/users/:id', (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  
  const user = findUserById(userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    creditCard: user.creditCard,
    address: user.address,
    isAdmin: user.isAdmin
  });
});

app.get('/api/products', (req: Request, res: Response) => {
  res.json(products);
});

app.post('/api/orders', (req: Request, res: Response) => {
  const session = req.cookies.session;
  
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const validation = validateSession(session);
  
  if (!validation.valid) {
    return res.status(401).json({ error: validation.error });
  }
  
  const { items } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items required' });
  }
  
  const order = createOrder(validation.userId!, items);
  
  res.status(201).json({
    message: 'Order created successfully',
    order: {
      id: order.id,
      items: order.items,
      totalAmount: order.totalAmount,
      status: order.status
    }
  });
});

app.get('/api/orders/:id', (req: Request, res: Response) => {
  const orderId = parseInt(req.params.id);
  
  const order = findOrderById(orderId);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  res.json(order);
});

app.post('/api/orders/:id/payment', (req: Request, res: Response) => {
  const session = req.cookies.session;
  
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const validation = validateSession(session);
  
  if (!validation.valid) {
    return res.status(401).json({ error: validation.error });
  }
  
  const orderId = parseInt(req.params.id);
  const order = findOrderById(orderId);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  if (order.userId !== validation.userId) {
    return res.status(403).json({ error: 'Not your order' });
  }
  
  order.status = 'payment_submitted';
  
  res.json({
    message: 'Payment submitted successfully',
    order: {
      id: order.id,
      status: order.status
    }
  });
});

app.post('/api/orders/:id/confirm', (req: Request, res: Response) => {
  const session = req.cookies.session;
  
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const validation = validateSession(session);
  
  if (!validation.valid) {
    return res.status(401).json({ error: validation.error });
  }
  
  const orderId = parseInt(req.params.id);
  const order = findOrderById(orderId);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  if (order.userId !== validation.userId) {
    return res.status(403).json({ error: 'Not your order' });
  }
  
  order.status = 'confirmed';
  
  res.json({
    message: 'Order confirmed successfully! Your order will be shipped soon.',
    order: {
      id: order.id,
      status: order.status,
      totalAmount: order.totalAmount
    }
  });
});

app.get('/api/admin/users', (req: Request, res: Response) => {
  const session = req.cookies.session;
  
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const validation = validateSession(session);
  
  if (!validation.valid) {
    return res.status(401).json({ error: validation.error });
  }
  
  if (!validation.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  res.json({
    users: users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      creditCard: u.creditCard,
      address: u.address,
      isAdmin: u.isAdmin
    }))
  });
});

app.listen(PORT, () => {
  console.log(`🚨 VulnShop API running on http://localhost:${PORT}`);
  console.log('⚠️  WARNING: This application contains intentional security vulnerabilities!');
  console.log('⚠️  DO NOT deploy to production or expose to the internet!');
  console.log('');
  console.log('Test Users:');
  console.log('  - admin / admin123 (admin account)');
  console.log('  - alice / alice123');
  console.log('  - bob / bob123');
});

export default app;
