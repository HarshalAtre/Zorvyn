const mongoose = require('mongoose');

const connect = async () => {
  const uri = process.env.MONGO_URI;
  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
};

module.exports = connect;
