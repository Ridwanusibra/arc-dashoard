'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ThemeToggle } from '../components/ThemeToggle';
import { WalletStatsCard } from '../components/WalletStatsCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Dashboard() {
  const [window, setWindow] = useState<'24h' | '7d' | '30d'>('24h');

  const { data: faucet } = useQuery({
    queryKey: ['faucet', window],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/faucet?window=${window}`);
      return res.data?.faucetTxs ?? 0;
    },
    staleTime: 10000,
  });

  const { data: volume } = useQuery({
    queryKey: ['volume', window],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/volume?window=${window}`);
      return res.data?.totalUSDC ?? 0;
    },
    staleTime: 10000,
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard', window],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/leaderboard?window=${window}`);
      return res.data ?? [];
    },
    staleTime: 10000,
  });

  const { data: chartData } = useQuery({
    queryKey: ['chart', window],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/analytics?window=${window}`);
      return res.data ?? [];
    },
    staleTime: 10000,
  });

  return (
    <main className="min-h-screen p-6 max-w-7xl mx-auto">
      <header className="flex justify-between items-center">
        <h1 className="text-4xl font-bold tracking-tight">Arc Testnet Dashboard</h1>
        <ThemeToggle />
      </header>

      <div className="flex gap-3 mt-6">
        {['24h', '7d', '30d'].map(w => (
          <button
            key={w}
            onClick={() => setWindow(w as any)}
            className={`px-4 py-2 rounded-full font-semibold transition
              ${window === w ? 'bg-primary text-white shadow-lg' : 'border border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
          >
            {w}
          </button>
        ))}
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="card bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
          <h3 className="opacity-70">Faucet Transactions</h3>
          <p className="text-3xl font-bold text-accent">{faucet}</p>
        </div>
        <div className="card bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
          <h3 className="opacity-70">Total USDC Transferred</h3>
          <p className="text-3xl font-bold text-secondary">{volume?.toLocaleString()}</p>
        </div>
        <div className="card bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
          <h3 className="opacity-70">Top Builders</h3>
          <ol className="list-decimal pl-5 mt-2 space-y-1">
            {leaderboard?.map((item: any, idx: number) => (
              <li key={item.address} className={idx < 3 ? 'text-primary font-semibold' : ''}>
                {item.address.slice(0, 6)}...{item.address.slice(-4)} ({item.tx_count})
              </li>
            ))}
          </ol>
        </div>
      </section>

      <WalletStatsCard window={window} />

      {chartData && chartData.length > 0 && (
        <section className="mt-10 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <h3 className="opacity-70 mb-4">Transactions Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
              <XAxis dataKey="block" stroke="#8884d8" />
              <YAxis stroke="#8884d8" />
              <Tooltip />
              <Line type="monotone" dataKey="txs" stroke="#4f46e5" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}
    </main>
  );
}