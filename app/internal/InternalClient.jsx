'use client';

import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import FilterBar from '@/components/ui/FilterBar';
import KPICard from '@/components/ui/KPICard';
import ChartCard from '@/components/ui/ChartCard';
import SectionLabel from '@/components/ui/SectionLabel';
import { fmtMonth } from '@/lib/format';
import { pctNum, fmtSecs, fmtRevenue, successRateByGroup, monthlyAvgTrend } from '@/lib/metrics';

const AGENT_TYPES = ['Service AI', 'Sales AI', 'Outbound AI'];
const CHANNELS = ['Call', 'Text', 'Email'];
const LANGUAGES = ['English', 'Spanish'];

const DEALER_COLORS = [
  '#673D7D', '#0d9488', '#d97706', '#e11d48', '#059669', '#8b5cf6',
  '#06b6d4', '#f97316', '#ec4899', '#84cc16', '#a78bfa', '#14b8a6',
  '#fbbf24', '#fb7185', '#4ade80',
];

const AXIS_TICK = { fill: '#8b8696', fontSize: 11 };
const AXIS_LINE = { stroke: '#2a2a3a' };
const GRID_STROKE = '#2a2a3a';
const TOOLTIP_STYLE = {
  backgroundColor: '#16161f',
  border: '1px solid #2a2a3a',
  borderRadius: 8,
  color: '#f1eff5',
  fontSize: 12,
};
const TOOLTIP_LABEL_STYLE = { color: '#f1eff5' };
const TOOLTIP_CURSOR = { fill: 'rgba(255,255,255,0.04)' };

function pctTooltipFormatter(value) {
  return [`${value.toFixed(1)}%`, 'Success Rate'];
}

export default function InternalClient({ data }) {
  const [selected, setSelected] = useState([]);

  const allMonths = useMemo(
    () => Array.from(new Set(data.map((r) => r.month))).filter(Boolean).sort(),
    [data]
  );

  const dealerships = useMemo(
    () => Array.from(new Set(data.map((r) => r['Dealership Name']))).filter(Boolean).sort(),
    [data]
  );

  const filteredRows = useMemo(() => {
    if (selected.length === 0) return data;
    const monthSet = new Set(selected);
    return data.filter((r) => monthSet.has(r.month));
  }, [data, selected]);

  const totalCalls = filteredRows.length;

  const successCount = useMemo(
    () => filteredRows.filter((r) => r.Success === 'Yes').length,
    [filteredRows]
  );
  const abandonedCount = useMemo(
    () => filteredRows.filter((r) => r['Call Abandoned'] === 'Yes').length,
    [filteredRows]
  );
  const escalatedCount = useMemo(
    () => filteredRows.filter((r) => r['Escalated to Human'] === 'Yes').length,
    [filteredRows]
  );
  const avgDurationSecs = useMemo(() => {
    if (totalCalls === 0) return 0;
    const sum = filteredRows.reduce((acc, r) => acc + (r.duration_secs || 0), 0);
    return sum / totalCalls;
  }, [filteredRows, totalCalls]);
  const totalRevenue = useMemo(
    () => filteredRows.reduce((acc, r) => acc + (r.revenue || 0), 0),
    [filteredRows]
  );

  const successRate = pctNum(successCount, totalCalls);
  const abandonedRate = pctNum(abandonedCount, totalCalls);
  const escalatedRate = pctNum(escalatedCount, totalCalls);

  const agentTypeData = useMemo(
    () => successRateByGroup(filteredRows, 'Type of Agent', AGENT_TYPES),
    [filteredRows]
  );
  const channelData = useMemo(
    () => successRateByGroup(filteredRows, 'Channel', CHANNELS),
    [filteredRows]
  );
  const languageData = useMemo(
    () => successRateByGroup(filteredRows, 'Language', LANGUAGES),
    [filteredRows]
  );

  const dealershipData = useMemo(
    () =>
      dealerships.map((name, i) => {
        const subset = filteredRows.filter((r) => r['Dealership Name'] === name);
        const successes = subset.filter((r) => r.Success === 'Yes').length;
        return {
          name,
          value: pctNum(successes, subset.length),
          fill: DEALER_COLORS[i % DEALER_COLORS.length],
        };
      }),
    [dealerships, filteredRows]
  );

  const durationTrend = useMemo(
    () => monthlyAvgTrend(data, allMonths, selected, (r) => (r.duration_secs || 0) / 60),
    [data, allMonths, selected]
  );

  const abandonmentTrend = useMemo(
    () => monthlyAvgTrend(data, allMonths, selected, (r) => (r['Call Abandoned'] === 'Yes' ? 100 : 0)),
    [data, allMonths, selected]
  );

  const escalationTrend = useMemo(
    () => monthlyAvgTrend(data, allMonths, selected, (r) => (r['Escalated to Human'] === 'Yes' ? 100 : 0)),
    [data, allMonths, selected]
  );

  const statusText = `Showing ${totalCalls.toLocaleString()} calls`;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-6">
      <FilterBar
        months={allMonths}
        selected={selected}
        onChange={setSelected}
        onClear={() => setSelected([])}
        statusText={statusText}
      />

      <div className="grid grid-cols-6 gap-4">
        <KPICard
          label="Total Calls"
          value={totalCalls.toLocaleString()}
          sub="in selected period"
          accent="#673D7D"
        />
        <KPICard
          label="Success Rate"
          value={`${successRate.toFixed(1)}%`}
          sub={`${successCount.toLocaleString()} successful`}
          accent="#059669"
        />
        <KPICard
          label="Avg Duration"
          value={fmtSecs(avgDurationSecs)}
          sub="per call"
          accent="#0d9488"
        />
        <KPICard
          label="Abandoned"
          value={`${abandonedRate.toFixed(1)}%`}
          sub={`${abandonedCount.toLocaleString()} calls`}
          accent="#e11d48"
        />
        <KPICard
          label="Escalated"
          value={`${escalatedRate.toFixed(1)}%`}
          sub={`${escalatedCount.toLocaleString()} calls`}
          accent="#d97706"
        />
        <KPICard
          label="Total Revenue"
          value={fmtRevenue(totalRevenue)}
          sub="estimated"
          accent="#6b7280"
        />
      </div>

      <SectionLabel>Success Rates</SectionLabel>

      <div className="grid grid-cols-3 gap-4">
        <ChartCard eyebrow="Success Rate" title="By Agent Type">
          <PercentBarChart data={agentTypeData} color="#673D7D" />
        </ChartCard>
        <ChartCard eyebrow="Success Rate" title="By Channel">
          <PercentBarChart data={channelData} color="#0d9488" />
        </ChartCard>
        <ChartCard eyebrow="Success Rate" title="By Language">
          <PercentBarChart data={languageData} color="#d97706" />
        </ChartCard>
      </div>

      <SectionLabel>Dealership Comparison</SectionLabel>

      <ChartCard eyebrow="Success Rate" title="By Dealership">
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={dealershipData} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
            <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              unit="%"
              tick={AXIS_TICK}
              axisLine={AXIS_LINE}
              tickLine={AXIS_LINE}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={170}
              tick={AXIS_TICK}
              axisLine={AXIS_LINE}
              tickLine={AXIS_LINE}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              formatter={pctTooltipFormatter}
              cursor={TOOLTIP_CURSOR}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {dealershipData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <SectionLabel>Monthly Trends</SectionLabel>

      <ChartCard eyebrow="Monthly Trend" title="Avg Call Duration">
        <TrendLineChart
          data={durationTrend}
          color="#0d9488"
          label="Avg Duration"
          valueFormatter={(v) => `${v.toFixed(1)}m`}
          yAxisProps={{ unit: 'm' }}
          height={280}
        />
      </ChartCard>

      <div className="grid grid-cols-2 gap-4">
        <ChartCard eyebrow="Monthly Trend" title="Abandonment Rate">
          <TrendLineChart
            data={abandonmentTrend}
            color="#e11d48"
            label="Abandonment Rate"
            valueFormatter={(v) => `${v.toFixed(1)}%`}
            yAxisProps={{ domain: [0, 100], unit: '%' }}
          />
        </ChartCard>
        <ChartCard eyebrow="Monthly Trend" title="Escalation Rate">
          <TrendLineChart
            data={escalationTrend}
            color="#d97706"
            label="Escalation Rate"
            valueFormatter={(v) => `${v.toFixed(1)}%`}
            yAxisProps={{ domain: [0, 100], unit: '%' }}
          />
        </ChartCard>
      </div>
    </div>
  );
}

function PercentBarChart({ data, color }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
        <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={AXIS_LINE} />
        <YAxis domain={[0, 100]} unit="%" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={AXIS_LINE} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          formatter={pctTooltipFormatter}
          cursor={TOOLTIP_CURSOR}
        />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function TrendLineChart({ data, color, label, valueFormatter, yAxisProps, height = 240 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 16, bottom: 24, left: 8 }}>
        <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={fmtMonth}
          tick={AXIS_TICK}
          axisLine={AXIS_LINE}
          tickLine={AXIS_LINE}
          angle={-35}
          textAnchor="end"
          height={56}
        />
        <YAxis tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={AXIS_LINE} {...yAxisProps} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          labelFormatter={fmtMonth}
          formatter={(value) => [value == null ? '—' : valueFormatter(value), label]}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={{ r: 3, strokeWidth: 0 }}
          activeDot={{ r: 4 }}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
