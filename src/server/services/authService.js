import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../db/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'bidxchange-jwt-production-secret-key-2026';
const TOKEN_EXPIRY = '7d';

export class AuthService {
  static signToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      roles: user.roles,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {
      return null;
    }
  }

  static async register(data) {
    const emailNorm = data.email ? data.email.trim().toLowerCase() : '';
    if (!emailNorm || !data.password || !data.name) {
      throw new Error('All fields (name, email, password) are required');
    }

    if (data.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    if (db.getUserByEmail(emailNorm)) {
      throw new Error('An account with this email address already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const initialRole = data.role === 'SELLER' ? 'SELLER' : 'BUYER';
    const roles = initialRole === 'SELLER' ? ['BUYER', 'SELLER'] : ['BUYER'];

    const newUser = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: emailNorm,
      passwordHash,
      name: data.name.trim(),
      role: initialRole,
      roles,
      walletBalance: 10000,
      isSuspended: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name)}`,
    };

    db.users.set(newUser.id, newUser);

    db.auditLogs.push({
      id: `log-${Date.now()}`,
      action: 'USER_REGISTERED',
      entity: 'USER',
      actorId: newUser.id,
      actorEmail: newUser.email,
      createdAt: new Date().toISOString(),
    });

    const token = this.signToken(newUser);
    const { passwordHash: _, ...safeUser } = newUser;
    return { user: safeUser, token };
  }

  static async login(credentials) {
    const emailNorm = credentials.email ? credentials.email.trim().toLowerCase() : '';
    const user = db.getUserByEmail(emailNorm);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (user.isSuspended) {
      throw new Error('Your account has been suspended by an administrator. Please contact support.');
    }

    const isMatch = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    db.auditLogs.push({
      id: `log-${Date.now()}`,
      action: 'USER_LOGIN',
      entity: 'USER',
      actorId: user.id,
      actorEmail: user.email,
      createdAt: new Date().toISOString(),
    });

    const token = this.signToken(user);
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
  }

  static toggleSellerRole(userId) {
    const user = db.getUserById(userId);
    if (!user) throw new Error('User not found');

    const hasSeller = user.roles.includes('SELLER');
    if (hasSeller) {
      user.role = 'BUYER';
      user.roles = user.roles.filter((r) => r !== 'SELLER');
    } else {
      user.roles.push('SELLER');
      user.role = 'SELLER';
    }

    user.updatedAt = new Date().toISOString();
    db.users.set(user.id, user);

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }
}
