import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from '../server/services/authService.js';
import { db } from '../server/db/database.js';

test('AuthService: should successfully register a new buyer', async () => {
  const email = `testuser-${Date.now()}@example.com`;
  const { user, token } = await AuthService.register({
    email,
    password: 'SecurePassword123!',
    name: 'Test Buyer',
  });

  assert.equal(user.email, email);
  assert.equal(user.name, 'Test Buyer');
  assert.equal(user.role, 'BUYER');
  assert.ok(token.length > 20);

  const payload = AuthService.verifyToken(token);
  assert.ok(payload);
  assert.equal(payload.userId, user.id);
});

test('AuthService: should prevent duplicate email registration', async () => {
  const email = 'duplicate-check@example.com';
  await AuthService.register({
    email,
    password: 'Password123!',
    name: 'First User',
  });

  await assert.rejects(
    async () => {
      await AuthService.register({
        email,
        password: 'Password123!',
        name: 'Second User',
      });
    },
    { message: 'An account with this email address already exists' }
  );
});

test('AuthService: should authenticate existing user with valid password and reject invalid', async () => {
  const email = 'alex@bidxchange.com';
  const { user, token } = await AuthService.login({
    email,
    password: 'Password123!',
  });

  assert.equal(user.email, email);
  assert.ok(token);

  await assert.rejects(
    async () => {
      await AuthService.login({
        email,
        password: 'WrongPassword!',
      });
    },
    { message: 'Invalid email or password' }
  );
});

test('AuthService: should toggle seller role for a user', () => {
  const user = db.getUserByEmail('alex@bidxchange.com');
  assert.ok(user);

  const updated = AuthService.toggleSellerRole(user.id);
  assert.ok(updated.roles.includes('SELLER'));
});
