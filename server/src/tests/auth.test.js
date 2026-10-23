const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');

let mongo;
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});
beforeEach(async () => {
  await User.deleteMany();
  await User.create({ name: 'Admin', email: 'admin@test.com', password: 'Admin1234', role: 'admin' });
  await User.create({ name: 'Staff', email: 'staff@test.com', password: 'Staff1234', role: 'staff' });
});

const login = async (email, password) => {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email, password });
  return agent;
};

describe('Login / logout', () => {
  it('logs in with valid credentials and sets an httpOnly cookie', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'Admin1234' });
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'][0]).toMatch(/HttpOnly/);
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.token).toBeUndefined();
  });
  it('rejects a wrong password with a generic message', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'bad' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });
  it('gives the same message for an unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@test.com', password: 'whatever1' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });
  it('rejects an inactive user', async () => {
    await User.updateOne({ email: 'staff@test.com' }, { isActive: false });
    const res = await request(app).post('/api/auth/login').send({ email: 'staff@test.com', password: 'Staff1234' });
    expect(res.status).toBe(403);
  });
  it('returns field errors for invalid input', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.errors.map((e) => e.field)).toEqual(expect.arrayContaining(['email', 'password']));
  });
  it('logout clears the session', async () => {
    const agent = await login('admin@test.com', 'Admin1234');
    await agent.get('/api/auth/me').expect(200);
    await agent.post('/api/auth/logout').expect(200);
    await agent.get('/api/auth/me').expect(401);
  });
  it('stores only hashed passwords', async () => {
    const u = await User.findOne({ email: 'admin@test.com' }).select('+password');
    expect(u.password).not.toBe('Admin1234');
    expect(u.password).toMatch(/^\$2[aby]\$12\$/);
  });
  it('rejects a tampered token', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', 'token=abc.def.ghi');
    expect(res.status).toBe(401);
  });
});

describe('Permissions and protected routes', () => {
  it('blocks unauthenticated access', async () => {
    await request(app).get('/api/users').expect(401);
    await request(app).get('/api/products').expect(401);
    await request(app).get('/api/sales').expect(401);
    await request(app).get('/api/reports').expect(401);
  });
  it('lets staff use POS routes but not admin-only ones', async () => {
    const agent = await login('staff@test.com', 'Staff1234');
    await agent.get('/api/products').expect(200);
    await agent.get('/api/sales').expect(200);
    await agent.get('/api/reports').expect(403);
  });
  it('blocks staff from user management (403)', async () => {
    const agent = await login('staff@test.com', 'Staff1234');
    await agent.get('/api/users').expect(403);
    await agent.post('/api/users').send({}).expect(403);
    await agent.patch('/api/users/123/status').send({ isActive: false }).expect(403);
  });
  it('lets admin open reports', async () => {
    const agent = await login('admin@test.com', 'Admin1234');
    await agent.get('/api/reports').expect(200);
  });
  it('deactivated user with an existing session is blocked immediately', async () => {
    const agent = await login('staff@test.com', 'Staff1234');
    await agent.get('/api/auth/me').expect(200);
    await User.updateOne({ email: 'staff@test.com' }, { isActive: false });
    await agent.get('/api/auth/me').expect(401);
    await agent.get('/api/products').expect(401);
  });
});
