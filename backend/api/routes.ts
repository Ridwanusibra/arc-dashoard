import express from 'express';
import { getDB } from '../db/db';
import { secondsForWindow, since } from '../utils/time';
import { sendAlert } from '../alerts/discord';

const router = express.Router();

// ===== Faucet stats =====
router.get('/faucet', async (req, res) => {
  try {
    const db = await getDB();
    const window = req.query.window as string;
    const sec = secondsForWindow(window);
    const cond = sec ? `AND timestamp >= ${since(sec)}` : '';
    const row = await db.get(
      `SELECT COUNT(*) as faucetTxs FROM transactions WHERE faucet=1 ${cond}`
    );
    res.json(row || { faucetTxs: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch faucet stats' });
  }
});

// ===== Leaderboard =====
router.get('/leaderboard', async (req, res) => {
  try {
    const db = await getDB();
    const window = req.query.window as string;
    const sec = secondsForWindow(window);
    const cond = sec ? `WHERE timestamp >= ${since(sec)}` : '';
    const rows = await db.all(`
      SELECT from_addr as address, COUNT(*) as tx_count
      FROM transactions
      ${cond}
      GROUP BY from_addr
      ORDER BY tx_count DESC
      LIMIT 10
    `);
    res.json(rows || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// ===== Total volume =====
router.get('/volume', async (req, res) => {
  try {
    const db = await getDB();
    const window = req.query.window as string;
    const sec = secondsForWindow(window);
    const cond = sec ? `WHERE timestamp >= ${since(sec)}` : '';
    const row = await db.get(`SELECT SUM(value) as totalUSDC FROM transactions ${cond}`);
    res.json({ totalUSDC: row?.totalUSDC || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch total volume' });
  }
});

// ===== Address stats =====
router.get('/address/:address', async (req, res) => {
  try {
    const db = await getDB();
    const addr = req.params.address.toLowerCase();
    const window = req.query.window as string;
    const sec = secondsForWindow(window);
    const cond = sec ? `AND timestamp >= ${since(sec)}` : '';
    const row = await db.get(`
      SELECT 
        from_addr as address,
        SUM(value) as totalSent,
        COUNT(*) as txCount
      FROM transactions
      WHERE from_addr='${addr}' ${cond}
    `);
    res.json(row || { address: addr, totalSent: 0, txCount: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch address stats' });
  }
});

// ===== Wallet stats (new) =====
router.get('/user/:address', async (req, res) => {
  try {
    const db = await getDB();
    const addr = req.params.address.toLowerCase();
    const window = req.query.window as string;
    const sec = secondsForWindow(window);
    const cond = sec ? `AND timestamp >= ${since(sec)}` : '';

    const row = await db.get(`
      SELECT 
        COUNT(*) as totalTx,
        SUM(value) as totalUSDC,
        SUM(gas_used) as totalGas
      FROM transactions
      WHERE (from_addr='${addr}' OR to_addr='${addr}') ${cond}
    `);

    res.json({
      totalTx: row?.totalTx || 0,
      totalUSDC: row?.totalUSDC || 0,
      totalGas: row?.totalGas || 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch wallet stats' });
  }
});

// ===== Discord alert =====
router.post('/alert', async (req, res) => {
  try {
    const { txHash, to, value } = req.body;
    await sendAlert(
      `🚨 Faucet alert\nWallet: ${to}\nAmount: ${value} USDC\nTx: ${txHash}`
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send alert' });
  }
});

export default router;