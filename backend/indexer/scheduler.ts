// backend/indexer/scheduler.ts
import axios from 'axios';
import { getDB, insertTransaction } from '../db/db';

const ARC_RPC = 'https://rpc.testnet.arc.network';

let lastBlockNumber = 0;

export async function startIndexer() {
  console.log('⏳ Starting Arc indexer...');

  const poll = async () => {
    try {
      // 1️⃣ Get the latest block number
      const blockResp = await axios.post(ARC_RPC, {
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1,
      });

      const latestBlockHex = blockResp.data.result;
      const latestBlock = parseInt(latestBlockHex, 16);

      if (latestBlock <= lastBlockNumber) return; // no new blocks
      lastBlockNumber = latestBlock;

      console.log('📦 New block:', latestBlock);

      // 2️⃣ Get full block with transactions
      const blockDetailResp = await axios.post(ARC_RPC, {
        jsonrpc: '2.0',
        method: 'eth_getBlockByNumber',
        params: [latestBlockHex, true],
        id: 1,
      });

      const block = blockDetailResp.data.result;
      const txs = block.transactions || [];

      const db = await getDB();

      // 3️⃣ Iterate transactions
      for (const tx of txs) {
        const value = parseInt(tx.value, 16) / 1e18; // native token
        const timestamp = parseInt(block.timestamp, 16);
        const faucet = value >= 1 ? 1 : 0;

        // 4️⃣ Get exact gas used from receipt
        let gasUsed = 0;
        try {
          const receiptResp = await axios.post(ARC_RPC, {
            jsonrpc: '2.0',
            method: 'eth_getTransactionReceipt',
            params: [tx.hash],
            id: 1,
          });
          gasUsed = parseInt(receiptResp.data.result?.gasUsed || '0x0', 16);
        } catch (err) {
          console.warn(`⚠️ Failed to fetch receipt for tx ${tx.hash}, using gas=0`);
        }

        // 5️⃣ Insert into DB
        await insertTransaction({
          hash: tx.hash,
          from_addr: tx.from,
          to_addr: tx.to,
          value,
          gas_used: gasUsed,
          timestamp,
          faucet,
        });
      }

      console.log(`✅ Stored ${txs.length} txs from block ${latestBlock}`);
    } catch (err) {
      console.error('Indexer error', err);
    }
  };

  // Run immediately and then every 15s
  await poll();
  setInterval(poll, 15000);
}