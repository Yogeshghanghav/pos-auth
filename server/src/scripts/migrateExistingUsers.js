// OPTIONAL: for projects that already have a `users` collection.
// Adds role/isActive defaults and bcrypt-hashes any password that is not already a bcrypt hash.
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const col = mongoose.connection.collection('users');
  await col.updateMany({ role: { $exists: false } }, { $set: { role: 'staff' } });
  await col.updateMany({ isActive: { $exists: false } }, { $set: { isActive: true } });
  let hashed = 0;
  for await (const u of col.find({ password: { $exists: true } })) {
    if (/^\$2[aby]\$/.test(u.password)) continue;
    await col.updateOne({ _id: u._id }, { $set: { password: await bcrypt.hash(u.password, 12) } });
    hashed++;
  }
  console.log(`Migration done. Hashed ${hashed} plain-text passwords.`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
