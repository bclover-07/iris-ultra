'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';

export function MarksTrendChart({ trendData, marksTrendDatasets, chartColors }: { trendData: any[], marksTrendDatasets: any[], chartColors: string[] }) {
  if (!trendData || trendData.length === 0) return <p className="font-fredoka text-gray-400 text-center py-12 text-lg">No marks data yet ✏️</p>;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={trendData}>
        <CartesianGrid strokeDasharray="5 2" stroke="var(--chart-grid, rgba(0,0,0,0.08))" />
        <XAxis dataKey="exam" tick={{ fill: 'var(--chart-text, #666)' }} style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 12 }} />
        <YAxis tick={{ fill: 'var(--chart-text, #666)' }} style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 12 }} />
        <Tooltip contentStyle={{ fontFamily: 'Fredoka, sans-serif', borderRadius: 16, border: '3px solid var(--border-card, #111)', backgroundColor: 'var(--bg-card, #fff)', color: 'var(--text-primary, #000)', boxShadow: '4px 4px 0 var(--brutal-shadow, #111)' }} />
        <Legend wrapperStyle={{ fontFamily: 'Fredoka, sans-serif', fontSize: 13, color: 'var(--text-secondary)' }} />
        {marksTrendDatasets?.map((ds, i) => (
          <Line key={ds.label} type="monotone" dataKey={ds.label} stroke={chartColors[i % chartColors.length]} strokeWidth={3} dot={{ r: 5, fill: chartColors[i % chartColors.length], strokeWidth: 2, stroke: 'var(--border-card, #111)' }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SubjectRadarChart({ radarData }: { radarData: any[] }) {
  if (!radarData || radarData.length === 0) return <p className="font-fredoka text-gray-400 text-center py-12 text-lg">No subject data yet 📚</p>;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <RadarChart data={radarData}>
        <PolarGrid stroke="var(--chart-grid, rgba(0,0,0,0.12))" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--chart-text, #666)' }} style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 12 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'var(--chart-text, #666)' }} style={{ fontSize: 10 }} />
        <Radar name="Score" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.35} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function AttendancePieChart({ attendancePie }: { attendancePie: any[] }) {
  return (
    <PieChart width={80} height={80}>
      <Pie data={attendancePie} cx={40} cy={40} innerRadius={22} outerRadius={32} dataKey="value" startAngle={90} endAngle={-270}>
        {attendancePie.map((e, i) => <Cell key={i} fill={e.color} />)}
      </Pie>
    </PieChart>
  );
}
