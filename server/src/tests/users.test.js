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

const loginAs = async (email, password) => {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email, password }).expect(200);
  return agent;
};

describe('User management (admin)', () => {
  it('creates, edits, deactivates and reactivates a user', async () => {
    const agent = await loginAs('admin@test.com', 'Admin1234');
    const created = await agent.post('/api/users').send({ name: 'New Person', email: 'new@test.com', password: 'Newpass123' }).expect(201);
    expect(created.body.user.role).toBe('staff');
    expect(created.body.user.password).toBeUndefined();
    const id = created.body.user._id;

    const edited = await agent.put(`/api/users/${id}`).send({ name: 'Renamed' }).expect(200);
    expect(edited.body.user.name).toBe('Renamed');

    await agent.patch(`/api/users/${id}/status`).send({ isActive: false }).expect(200);
    await request(app).post('/api/auth/login').send({ email: 'new@test.com', password: 'Newpass123' }).expect(403);

    await agent.patch(`/api/users/${id}/status`).send({ isActive: true }).expect(200);
    await request(app).post('/api/auth/login').send({ email: 'new@test.com', password: 'Newpass123' }).expect(200);
  });
  it('re-hashes the password when an admin resets it', async () => {
    const agent = await loginAs('admin@test.com', 'Admin1234');
    const staff = await User.findOne({ email: 'staff@test.com' });
    await agent.put(`/api/users/${staff.id}`).send({ password: 'Fresh1234' }).expect(200);
    await request(app).post('/api/auth/login').send({ email: 'staff@test.com', password: 'Fresh1234' }).expect(200);
    await request(app).post('/api/auth/login').send({ email: 'staff@test.com', password: 'Staff1234' }).expect(401);
  });
  it('lists with search and pagination, never exposing passwords', async () => {
    const agent = await loginAs('admin@test.com', 'Admin1234');
    const res = await agent.get('/api/users?search=staff&page=1&limit=5').expect(200);
    expect(res.body.total).toBe(1);
    expect(res.body.users[0].password).toBeUndefined();
  });
  it('validates inputs', async () => {
    const agent = await loginAs('admin@test.com', 'Admin1234');
    const res = await agent.post('/api/users').send({ name: 'x', email: 'bad', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThanOrEqual(3);
  });
  it('rejects unknown fields on update (no mass assignment)', async () => {
    const agent = await loginAs('admin@test.com', 'Admin1234');
    const staff = await User.findOne({ email: 'staff@test.com' });
    await agent.put(`/api/users/${staff.id}`).send({ isActive: false, _id: 'x' }).expect(400);
  });
  it('rejects duplicate emails', async () => {
    const agent = await loginAs('admin@test.com', 'Admin1234');
    await agent.post('/api/users').send({ name: 'Dup', email: 'STAFF@test.com', password: 'Dupe12345' }).expect(409);
  });
  it('returns 404 for unknown users and 400 for bad ids', async () => {
    const agent = await loginAs('admin@test.com', 'Admin1234');
    await agent.put(`/api/users/${new mongoose.Types.ObjectId()}`).send({ name: 'Ghost' }).expect(404);
    await agent.put('/api/users/not-an-id').send({ name: 'Ghost' }).expect(400);
  });
  it('admin cannot deactivate self or demote self', async () => {
    const agent = await loginAs('admin@test.com', 'Admin1234');
    const me = await agent.get('/api/auth/me');
    const id = me.body.user._id;
    await agent.patch(`/api/users/${id}/status`).send({ isActive: false }).expect(400);
    await agent.put(`/api/users/${id}`).send({ role: 'staff' }).expect(400);
  });
});
