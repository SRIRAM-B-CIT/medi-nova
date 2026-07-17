require('dotenv').config();
const express = require('express');
const connectDB = require('./config/database');
const apiApp = require('./app');

const app = express();
app.use('/api', apiApp);

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`MediNova API is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
