require('dotenv').config();
const mongoose = require('mongoose');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. See .env.example');
  process.exit(1);
}
const app = require('./app');

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Atlas connected successfully');

    app.listen(process.env.PORT || 5000, () => {
      console.log('API running');
    });
  })
  .catch((e) => {
    console.error('DB connection failed:', e.message);
    process.exit(1);
  });