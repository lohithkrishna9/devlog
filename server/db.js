require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('Mongo error', err);
    process.exit(1);
  });