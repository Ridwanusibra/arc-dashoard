import express from 'express';
import cors from 'cors';
import router from './api/routes';
import { startIndexer } from './indexer/scheduler';

const app = express();
app.use(cors());
app.use(express.json());

// Log every request
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/', router);

// Start Arc indexer
startIndexer();

// Health check
app.get('/health', (_, res) => res.json({ ok: true }));

// Use port 4000, bind to all interfaces
const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => console.log(`Backend running on ${PORT}`));