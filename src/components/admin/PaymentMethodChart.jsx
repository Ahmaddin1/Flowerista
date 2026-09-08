'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PAYMENT_METHOD_LABELS } from '@/lib/constants';

const ALLOWED_METHODS = ['cod', 'bank_deposit'];

const PAYMENT_COLORS = {
  cod: 'var(--admin-accent)',
  bank_deposit: 'var(--admin-text-muted)',
};

export default function PaymentMethodChart({ data }) {
  const filtered = (data ?? [])
    .filter((entry) => ALLOWED_METHODS.includes(entry.method))
    .map((entry) => ({
      ...entry,
      label: PAYMENT_METHOD_LABELS[entry.method],
    }));

  if (filtered.length === 0) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height: 300, color: 'var(--admin-text-muted)', fontSize: 13 }}
      >
        No orders yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={filtered}
          dataKey="count"
          nameKey="label"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label
        >
          {filtered.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={PAYMENT_COLORS[entry.method] ?? 'var(--admin-border)'}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--admin-surface)',
            border: '1px solid var(--admin-border)',
            color: 'var(--admin-text)',
          }}
        />
        <Legend wrapperStyle={{ color: 'var(--admin-text)' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
