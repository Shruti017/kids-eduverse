// Vercel's Express entrypoint. Local development uses KIDS-EDUVERSE-Backend/server.js.
const express = require('express');
const app = express();
app.use(require('./KIDS-EDUVERSE-Backend/app'));

module.exports = app;
