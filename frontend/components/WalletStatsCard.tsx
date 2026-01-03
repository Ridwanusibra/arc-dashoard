'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function WalletStatsCard({ window }: { window: '24h' | '7d' | '30d' }) {
  const [wallet, setWallet] = useState('');
  const [address, setAddress] = useState('');

  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['userStats', address, window],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/user/${address}?window=${window}`);
      return res.data;
    },
    enabled: !!address,
    retry: false,
  });

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg mt-6 max-w-md mx-auto">
      <h3 className="text-xl font-semibold mb-4">Check Your Wallet Stats</h3>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Enter wallet address"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={() => setAddress(wallet)}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition"
        >
          Check
        </button>
      </div>

      {isLoading && <p>Loading...</p>}
      {isError && <p className="text-red-500">Error fetching stats. Check the address.</p>}

      {stats && (
        <div className="space-y-2">
          <p><strong>Total TX:</strong> {stats.totalTx}</p>
          <p><strong>Total USDC:</strong> {stats.totalUSDC?.toLocaleString()}</p>
          <p><strong>Total Gas Used:</strong> {stats.totalGas?.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}