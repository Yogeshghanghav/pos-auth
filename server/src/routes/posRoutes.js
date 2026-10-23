// Placeholder POS routes. Replace with your existing routers;
// only the auth/authorize wiring in app.js matters.
const express = require('express');
const make = (label) => {
  const r = express.Router();
  r.get('/', (_req, res) => res.json({ resource: label, items: [] }));
  return r;
};
module.exports = { products: make('products'), sales: make('sales'), reports: make('reports') };
