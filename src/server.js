import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateSubscription } from './proxy-handler.js';

// Get directory name in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 8080;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// API endpoint to generate the subscription
app.get('/api/v1/sub', async (req, res) => {
    try {
        // Get country codes from query param, split by comma, and convert to uppercase
        const countryFilter = req.query.cc || '';
        const countryCodes = countryFilter.split(',').map(c => c.trim().toUpperCase()).filter(c => c);

        const subscription = await generateSubscription(countryCodes);

        // Send the base64 encoded subscription as plain text
        res.header('Content-Type', 'text/plain;charset=utf-8');
        res.send(subscription);
    } catch (error) {
        console.error("Error generating subscription:", error);
        res.status(500).send('Failed to generate subscription.');
    }
});

// A simple status endpoint for health checks
app.get('/api/v1/status', (req, res) => {
    res.json({ status: 'ok' });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});