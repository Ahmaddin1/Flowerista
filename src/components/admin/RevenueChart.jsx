'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RevenueChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height: 300, color: 'var(--admin-text-muted)', fontSize: 13 }}
      >
        No revenue in this period.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid stroke="var(--admin-border)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: 'var(--admin-text-muted)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'var(--admin-text-muted)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => `Rs. ${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--admin-surface)',
            border: '1px solid var(--admin-border)',
            color: 'var(--admin-text)',
          }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="var(--admin-accent)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
