import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db, User, Role } from '../db/database.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'bidxchange-jwt-production-secret-key-2026';
const TOKEN_EXPIRY = '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  roles: Role[];
}

export class AuthService {
  public static signToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      roles: user.roles,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  }

  public static verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch {
      return null;
    }
  }

  public static async register(data: {
    email: string;
    password: string;
    name: string;
    role?: Role;
  }): Promise<{ user: Omit<User, 'passwordHash'>; token: string }> {
    const emailNorm = data.email.trim().toLowerCase();
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

    const initialRole: Role = data.role === 'SELLER' ? 'SELLER' : 'BUYER';
    const roles: Role[] = initialRole === 'SELLER' ? ['BUYER', 'SELLER'] : ['BUYER'];

    const newUser: User = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: emailNorm,
      passwordHash,
      name: data.name.trim(),
      role: initialRole,
      roles,
      walletBalance: 10000, // Starting simulated bidding budget
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

  public static async login(credentials: {
    email: string;
    password: string;
  }): Promise<{ user: Omit<User, 'passwordHash'>; token: string }> {
    const emailNorm = credentials.email.trim().toLowerCase();
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

  public static toggleSellerRole(userId: string): Omit<User, 'passwordHash'> {
    const user = db.getUserById(userId);
    if (!user) throw new Error('User not found');

    const hasSeller = user.roles.includes('SELLER');
    if (hasSeller) {
      // Toggle primary role if needed
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
