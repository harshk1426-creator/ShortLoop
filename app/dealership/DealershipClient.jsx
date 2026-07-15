'use client';

import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import Topbar from '@/components/layout/Topbar';
import FilterBar from '@/components/ui/FilterBar';
import KPICard from '@/components/ui/KPICard';
import ChartCard from '@/components/ui/ChartCard';
import SectionLabel from '@/components/ui/SectionLabel';
import { fmtMonth } from '@/lib/format';
import { pctNum, fmtSecs, successRateByGroup, monthlyAvgTrend } from '@/lib/metrics';

const AGENT_TYPES = ['Service AI', 'Sales AI', 'Outbound AI'];
const CHANNELS = ['Call', 'Text', 'Email'];
const LANGUAGES = ['English', 'Spanish'];
const TIME_SLOTS = ['12AM–6AM', '6AM–12PM', '12PM–6PM', '6PM–12AM'];

function getTimeSlot(timeStr) {
  if (!timeStr) return null;
  const hour = parseInt(timeStr.split(':')[0], 10);
  if (isNaN(hour)) return null;
  if (hour < 6) return '12AM–6AM';
  if (hour < 12) return '6AM–12PM';
  if (hour < 18) return '12PM–6PM';
  return '6PM–12AM';
}

const AXIS_TICK = { fill: '#6b6575', fontSize: 11 };
const AXIS_LINE = { stroke: '#e8e3ed' };
const GRID_STROKE = '#e8e3ed';
const TOOLTIP_STYLE = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #e8e3ed',
  borderRadius: 8,
  color: '#322D3C',
  fontSize: 12,
};
const TOOLTIP_LABEL_STYLE = { color: '#322D3C' };
const TOOLTIP_CURSOR = { fill: 'rgba(103,61,125,0.05)' };

const CAMPAIGN_TAG_COLORS = {
  Recall: { bg: '#fee2e2', text: '#991b1b' },
  Reactivation: { bg: '#dbeafe', text: '#1e40af' },
  'OEM Promo': { bg: '#d1fae5', text: '#065f46' },
  'Declined Service': { bg: '#fef3c7', text: '#92400e' },
  'Seasonal Promo': { bg: '#ede9fe', text: '#5b21b6' },
  Loyalty: { bg: '#fce7f3', text: '#9d174d' },
};
const DEFAULT_TAG_COLOR = { bg: '#f3f4f6', text: '#374151' };

function pctTooltipFormatter(value) {
  return [`${value.toFixed(1)}%`, 'Success Rate'];
}

export default function DealershipClient({ data }) {
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [selectedMonths, setSelectedMonths] = useState([]);

  const hasDealer = Boolean(selectedDealer);

  const dealerships = useMemo(
    () => Array.from(new Set(data.map((r) => r['Dealership Name']))).filter(Boolean).sort(),
    [data]
  );

  const allMonths = useMemo(
    () => Array.from(new Set(data.map((r) => r.month))).filter(Boolean).sort(),
    [data]
  );

  const dealerRows = useMemo(
    () => (hasDealer ? data.filter((r) => r['Dealership Name'] === selectedDealer) : []),
    [data, selectedDealer, hasDealer]
  );

  const filteredRows = useMemo(() => {
    if (!hasDealer) return [];
    if (selectedMonths.length === 0) return dealerRows;
    const monthSet = new Set(selectedMonths);
    return dealerRows.filter((r) => monthSet.has(r.month));
  }, [dealerRows, selectedMonths, hasDealer]);

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

  const timeOfDayData = useMemo(
    () =>
      TIME_SLOTS.map((slot) => {
        const slotRows = filteredRows.filter((r) => getTimeSlot(r['Time']) === slot);
        const successes = slotRows.filter((r) => r.Success === 'Yes').length;
        return { name: slot, value: pctNum(successes, slotRows.length) };
      }),
    [filteredRows]
  );

  const durationTrend = useMemo(
    () => monthlyAvgTrend(dealerRows, allMonths, selectedMonths, (r) => (r.duration_secs || 0) / 60),
    [dealerRows, allMonths, selectedMonths]
  );
  const abandonmentTrend = useMemo(
    () =>
      monthlyAvgTrend(dealerRows, allMonths, selectedMonths, (r) =>
        r['Call Abandoned'] === 'Yes' ? 100 : 0
      ),
    [dealerRows, allMonths, selectedMonths]
  );
  const escalationTrend = useMemo(
    () =>
      monthlyAvgTrend(dealerRows, allMonths, selectedMonths, (r) =>
        r['Escalated to Human'] === 'Yes' ? 100 : 0
      ),
    [dealerRows, allMonths, selectedMonths]
  );

  const campaigns = useMemo(() => {
    const outboundRows = filteredRows.filter(
      (r) => r['Type of Agent'] === 'Outbound AI' && r['Campaign Name']
    );
    const map = new Map();
    for (const row of outboundRows) {
      const name = row['Campaign Name'];
      if (!map.has(name)) {
        map.set(name, { name, type: row['Campaign Type'], rows: [] });
      }
      map.get(name).rows.push(row);
    }
    return Array.from(map.values())
      .map(({ name, type, rows }) => {
        const totalContacts = rows.length;
        const attempts = rows
          .map((r) => parseInt(r['Attempt Number'], 10))
          .filter((n) => !Number.isNaN(n));
        const avgAttempt = attempts.length
          ? attempts.reduce((a, b) => a + b, 0) / attempts.length
          : 0;
        const responseCounts = new Map();
        for (const r of rows) {
          const respType = r['Response Type'] || 'Unknown';
          responseCounts.set(respType, (responseCounts.get(respType) || 0) + 1);
        }
        const responseBreakdown = Array.from(responseCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([label, count]) => `${label}: ${count}`)
          .join(' · ');
        const successes = rows.filter((r) => r.Success === 'Yes').length;
        return {
          name,
          type,
          totalContacts,
          avgAttempt,
          responseBreakdown,
          successRate: pctNum(successes, totalContacts),
        };
      })
      .sort((a, b) => b.totalContacts - a.totalContacts);
  }, [filteredRows]);

  const statusText = hasDealer
    ? `Showing ${totalCalls.toLocaleString()} calls`
    : 'No dealership selected';

  function toggleDealer(name) {
    setSelectedDealer((current) => (current === name ? null : name));
  }

  return (
    <div className="min-h-screen bg-sl-bg">
      <Topbar variant="dealership" dealerName={selectedDealer} />

      <div className="mx-auto max-w-[1400px] space-y-6 p-6">
        <div className="rounded-sl-card border border-sl-border bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-sl-muted">
            Select Dealership
          </div>
          <div className="flex flex-wrap gap-2">
            {dealerships.map((name) => {
              const isSelected = name === selectedDealer;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleDealer(name)}
                  aria-pressed={isSelected}
                  className={`rounded-sl-pill border px-3 py-1.5 text-xs transition-colors ${
                    isSelected
                      ? 'border-sl-purple bg-sl-purple font-semibold text-white'
                      : 'border-sl-border bg-[#f7f5fb] text-sl-muted'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>

        <FilterBar
          months={allMonths}
          selected={selectedMonths}
          onChange={setSelectedMonths}
          onClear={() => setSelectedMonths([])}
          statusText={statusText}
        />

        <div className="grid grid-cols-5 gap-4">
          <KPICard
            label="Total Calls"
            value={hasDealer ? totalCalls.toLocaleString() : '—'}
            sub={hasDealer ? 'in selected period' : 'select a dealership'}
            accent="#673D7D"
            bg="var(--sl-cream)"
          />
          <KPICard
            label="Success Rate"
            value={hasDealer ? `${successRate.toFixed(1)}%` : '—'}
            sub={hasDealer ? `${successCount.toLocaleString()} successful` : 'select a dealership'}
            accent="#059669"
            bg="var(--sl-cream)"
          />
          <KPICard
            label="Avg Duration"
            value={hasDealer ? fmtSecs(avgDurationSecs) : '—'}
            sub={hasDealer ? 'per call' : 'select a dealership'}
            accent="#0d9488"
            bg="var(--sl-cream)"
          />
          <KPICard
            label="Abandoned"
            value={hasDealer ? `${abandonedRate.toFixed(1)}%` : '—'}
            sub={hasDealer ? `${abandonedCount.toLocaleString()} calls` : 'select a dealership'}
            accent="#e11d48"
            bg="var(--sl-cream)"
          />
          <KPICard
            label="Escalated"
            value={hasDealer ? `${escalatedRate.toFixed(1)}%` : '—'}
            sub={hasDealer ? `${escalatedCount.toLocaleString()} calls` : 'select a dealership'}
            accent="#d97706"
            bg="var(--sl-cream)"
          />
        </div>

        <SectionLabel>Success Rates</SectionLabel>

        <div className="grid grid-cols-2 gap-4">
          <ChartCard eyebrow="Success Rate" title="By Agent Type">
            {hasDealer ? <PercentBarChart data={agentTypeData} color="#673D7D" /> : <EmptyState />}
          </ChartCard>
          <ChartCard eyebrow="Success Rate" title="By Channel">
            {hasDealer ? <PercentBarChart data={channelData} color="#0d9488" /> : <EmptyState />}
          </ChartCard>
          <ChartCard eyebrow="Success Rate" title="By Language">
            {hasDealer ? <PercentBarChart data={languageData} color="#d97706" /> : <EmptyState />}
          </ChartCard>
          <ChartCard eyebrow="By Time of Day" title="Success Rate by Hour Slot">
            {hasDealer ? (
              <PercentBarChart data={timeOfDayData} color="#8b5cf6" radius={[6, 6, 6, 6]} />
            ) : (
              <EmptyState />
            )}
          </ChartCard>
        </div>

        <SectionLabel>Monthly Trends</SectionLabel>

        <ChartCard eyebrow="Monthly Trend" title="Avg Call Duration">
          {hasDealer ? (
            <TrendLineChart
              data={durationTrend}
              color="#0d9488"
              label="Avg Duration"
              valueFormatter={(v) => `${v.toFixed(1)}m`}
              yAxisProps={{ unit: 'm' }}
              height={280}
            />
          ) : (
            <EmptyState height={280} />
          )}
        </ChartCard>

        <div className="grid grid-cols-2 gap-4">
          <ChartCard eyebrow="Monthly Trend" title="Abandonment Rate">
            {hasDealer ? (
              <TrendLineChart
                data={abandonmentTrend}
                color="#e11d48"
                label="Abandonment Rate"
                valueFormatter={(v) => `${v.toFixed(1)}%`}
                yAxisProps={{ domain: [0, 100], unit: '%' }}
              />
            ) : (
              <EmptyState />
            )}
          </ChartCard>
          <ChartCard eyebrow="Monthly Trend" title="Escalation Rate">
            {hasDealer ? (
              <TrendLineChart
                data={escalationTrend}
                color="#d97706"
                label="Escalation Rate"
                valueFormatter={(v) => `${v.toFixed(1)}%`}
                yAxisProps={{ domain: [0, 100], unit: '%' }}
              />
            ) : (
              <EmptyState />
            )}
          </ChartCard>
        </div>

        <SectionLabel>Outbound Campaigns</SectionLabel>

        <ChartCard eyebrow="Outbound AI" title="Campaign Performance">
          {!hasDealer ? (
            <EmptyState />
          ) : campaigns.length === 0 ? (
            <EmptyState message="No outbound campaign activity in this period." />
          ) : (
            <CampaignTable campaigns={campaigns} />
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function EmptyState({ height = 220, message = 'Select a dealership above to view performance data' }) {
  return (
    <div
      className="flex items-center justify-center px-6 text-center text-sm text-sl-muted"
      style={{ height }}
    >
      {message}
    </div>
  );
}

function PercentBarChart({ data, color, radius = [4, 4, 0, 0] }) {
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
        <Bar dataKey="value" fill={color} radius={radius} />
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

function CampaignTable({ campaigns }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-sl-border text-left text-[11px] uppercase tracking-[0.05em] text-sl-muted">
            <th className="px-3 py-2 font-semibold">Campaign</th>
            <th className="px-3 py-2 font-semibold">Type</th>
            <th className="px-3 py-2 font-semibold">Total Contacts</th>
            <th className="px-3 py-2 font-semibold">Avg Attempt #</th>
            <th className="px-3 py-2 font-semibold">Response Breakdown</th>
            <th className="px-3 py-2 font-semibold">Success Rate</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => {
            const tagColor = CAMPAIGN_TAG_COLORS[c.type] || DEFAULT_TAG_COLOR;
            const barWidth = Math.min(100, Math.max(0, c.successRate));
            return (
              <tr key={c.name} className="border-b border-sl-border last:border-0 hover:bg-[#f7f5fb]">
                <td className="px-3 py-3 font-medium text-sl-text">{c.name}</td>
                <td className="px-3 py-3">
                  <span
                    className="inline-block rounded-sl-pill px-2 py-0.5 text-[11px] font-semibold"
                    style={{ backgroundColor: tagColor.bg, color: tagColor.text }}
                  >
                    {c.type || 'Other'}
                  </span>
                </td>
                <td className="px-3 py-3 text-sl-text">{c.totalContacts.toLocaleString()}</td>
                <td className="px-3 py-3 text-sl-text">{c.avgAttempt.toFixed(1)}</td>
                <td className="px-3 py-3 text-xs text-sl-muted">{c.responseBreakdown}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-[6px] w-24 overflow-hidden rounded-full bg-sl-border">
                      <div
                        className="h-full rounded-full bg-sl-purple"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-sl-purple">
                      {c.successRate.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
