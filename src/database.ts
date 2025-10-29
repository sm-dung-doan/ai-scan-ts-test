export interface User {
  id: number;
  username: string;
  password: string;
  email: string;
  isAdmin: boolean;
  creditCard?: string;
  address?: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
}

export interface Order {
  id: number;
  userId: number;
  items: { productId: number; quantity: number; price: number }[];
  totalAmount: number;
  status: 'pending' | 'payment_submitted' | 'confirmed' | 'shipped';
  createdAt: Date;
}

export const users: User[] = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    email: 'admin@vulnshop.com',
    isAdmin: true,
    creditCard: '4532-1111-2222-3333',
    address: '123 Admin Street, Silicon Valley'
  },
  {
    id: 2,
    username: 'alice',
    password: 'alice123',
    email: 'alice@example.com',
    isAdmin: false,
    creditCard: '4532-4444-5555-6666',
    address: '456 User Avenue, New York'
  },
  {
    id: 3,
    username: 'bob',
    password: 'bob123',
    email: 'bob@example.com',
    isAdmin: false,
    creditCard: '4532-7777-8888-9999',
    address: '789 Customer Road, Los Angeles'
  }
];

export const products: Product[] = [
  { id: 1, name: 'Laptop', price: 999.99, description: 'High-performance laptop' },
  { id: 2, name: 'Mouse', price: 29.99, description: 'Wireless mouse' },
  { id: 3, name: 'Keyboard', price: 79.99, description: 'Mechanical keyboard' },
  { id: 4, name: 'Monitor', price: 299.99, description: '27-inch 4K monitor' },
  { id: 5, name: 'Headphones', price: 149.99, description: 'Noise-cancelling headphones' }
];

export const orders: Order[] = [
  {
    id: 1001,
    userId: 2,
    items: [{ productId: 1, quantity: 1, price: 999.99 }],
    totalAmount: 999.99,
    status: 'confirmed',
    createdAt: new Date('2025-10-20')
  },
  {
    id: 1002,
    userId: 3,
    items: [
      { productId: 2, quantity: 2, price: 29.99 },
      { productId: 3, quantity: 1, price: 79.99 }
    ],
    totalAmount: 139.97,
    status: 'shipped',
    createdAt: new Date('2025-10-22')
  }
];

let nextOrderId = 1003;

export function createOrder(userId: number, items: { productId: number; quantity: number; price: number }[]): Order {
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const order: Order = {
    id: nextOrderId++,
    userId,
    items,
    totalAmount,
    status: 'pending',
    createdAt: new Date()
  };
  orders.push(order);
  return order;
}

export function findUserByUsername(username: string): User | undefined {
  return users.find(u => u.username === username);
}

export function findUserById(id: number): User | undefined {
  return users.find(u => u.id === id);
}

export function findOrderById(id: number): Order | undefined {
  return orders.find(o => o.id === id);
}
