const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const TARGET = 'https://developer.expoexpressnp.com/v1/TrackShipments';

app.post('/api/track', async (req, res) => {
  try {
    const { awbs, awb } = req.body || {};
    const shipments = awbs || (awb ? (Array.isArray(awb) ? awb : [awb]) : []);
    if (!shipments || shipments.length === 0) {
      return res.status(400).json({ error: 'Missing AWB(s) in body. Provide { awb: "..." } or { awbs: ["..."] }' });
    }

    const payload = {
      APIKEY: process.env.APIKEY || '',
      Shipments: shipments,
      GetLastTrackingUpdateOnly: true
    };

    const r = await fetch(TARGET, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const text = await r.text();
    try {
      const json = JSON.parse(text);
      res.status(r.status).json(json);
    } catch (err) {
      res.status(r.status).send(text);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Proxy listening on http://localhost:${port}`));
