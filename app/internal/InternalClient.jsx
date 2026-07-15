'use client';

import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LabelList,
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
import {
  pctNum,
  fmtSecs,
  fmtRevenue,
  successRateWithShare,
  monthlyAvgTrend,
  computeKPITrend,
} from '@/lib/metrics';

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

  const successTrend = useMemo(
    () =>
      computeKPITrend(
        data, allMonths, selected,
        (rows) => pctNum(rows.filter((r) => r.Success === 'Yes').length, rows.length),
        true
      ),
    [data, allMonths, selected]
  );
  const abandonedTrend = useMemo(
    () =>
      computeKPITrend(
        data, allMonths, selected,
        (rows) => pctNum(rows.filter((r) => r['Call Abandoned'] === 'Yes').length, rows.length),
        false
      ),
    [data, allMonths, selected]
  );
  const escalatedTrend = useMemo(
    () =>
      computeKPITrend(
        data, allMonths, selected,
        (rows) => pctNum(rows.filter((r) => r['Escalated to Human'] === 'Yes').length, rows.length),
        false
      ),
    [data, allMonths, selected]
  );

  const agentTypeData = useMemo(
    () => successRateWithShare(filteredRows, 'Type of Agent', AGENT_TYPES),
    [filteredRows]
  );
  const channelData = useMemo(
    () => successRateWithShare(filteredRows, 'Channel', CHANNELS),
    [filteredRows]
  );
  const languageData = useMemo(
    () => successRateWithShare(filteredRows, 'Language', LANGUAGES),
    [filteredRows]
  );
  const timeOfDayData = useMemo(() => {
    const total = filteredRows.length;
    return TIME_SLOTS.map((slot) => {
      const slotRows = filteredRows.filter((r) => getTimeSlot(r['Time']) === slot);
      const successes = slotRows.filter((r) => r.Success === 'Yes').length;
      return {
        name: slot,
        successRate: pctNum(successes, slotRows.length),
        callShare: pctNum(slotRows.length, total),
        totalCalls: slotRows.length,
      };
    });
  }, [filteredRows]);

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
    <div className="mx-auto max-w-[1400px] space-y-4 p-4 sm:space-y-6 sm:p-6">
      <FilterBar
        months={allMonths}
        selected={selected}
        onChange={setSelected}
        onClear={() => setSelected([])}
        statusText={statusText}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <KPICard
          label="Total Calls"
          value={totalCalls.toLocaleString()}
          sub="in selected period"
          accent="#673D7D"
          valueFontSize={32}
        />
        <KPICard
          label="Success Rate"
          value={`${successRate.toFixed(1)}%`}
          sub={`${successCount.toLocaleString()} successful`}
          accent="#059669"
          trend={successTrend}
          valueFontSize={32}
          valueGlow
        />
        <KPICard
          label="Avg Duration"
          value={fmtSecs(avgDurationSecs)}
          sub="per call"
          accent="#0d9488"
          valueFontSize={32}
        />
        <KPICard
          label="Abandoned"
          value={`${abandonedRate.toFixed(1)}%`}
          sub={`${abandonedCount.toLocaleString()} calls`}
          accent="#e11d48"
          trend={abandonedTrend}
          valueFontSize={32}
          valueGlow
        />
        <KPICard
          label="Escalated"
          value={`${escalatedRate.toFixed(1)}%`}
          sub={`${escalatedCount.toLocaleString()} calls`}
          accent="#d97706"
          trend={escalatedTrend}
          valueFontSize={32}
          valueGlow
        />
        <KPICard
          label="Total Revenue"
          value={fmtRevenue(totalRevenue)}
          sub="estimated"
          accent="#6b7280"
          valueFontSize={32}
        />
      </div>

      <SectionLabel>Success Rates</SectionLabel>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ChartCard eyebrow="Success Rate" title="By Agent Type" accentColor="#673D7D">
          <PercentBarChart data={agentTypeData} color="#673D7D" isDark />
        </ChartCard>
        <ChartCard eyebrow="Success Rate" title="By Channel" accentColor="#0d9488">
          <PercentBarChart data={channelData} color="#0d9488" isDark />
        </ChartCard>
        <ChartCard eyebrow="Success Rate" title="By Language" accentColor="#d97706">
          <PercentBarChart data={languageData} color="#d97706" isDark />
        </ChartCard>
        <ChartCard eyebrow="By Time of Day" title="Success Rate by Hour Slot" accentColor="#8b5cf6">
          <PercentBarChart data={timeOfDayData} color="#8b5cf6" radius={[6, 6, 6, 6]} isDark />
        </ChartCard>
      </div>

      <SectionLabel>Dealership Comparison</SectionLabel>

      <ChartCard eyebrow="Success Rate" title="By Dealership" accentColor="#673D7D">
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
              formatter={(value) => [`${value.toFixed(1)}%`, 'Success Rate']}
              cursor={TOOLTIP_CURSOR}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} animationDuration={800} animationEasing="ease-out">
              {dealershipData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <SectionLabel>Monthly Trends</SectionLabel>

      <ChartCard eyebrow="Monthly Trend" title="Avg Call Duration" accentColor="#0d9488">
        <TrendLineChart
          data={durationTrend}
          color="#0d9488"
          label="Avg Duration"
          valueFormatter={(v) => `${v.toFixed(1)}m`}
          yAxisProps={{ unit: 'm' }}
          height={280}
        />
      </ChartCard>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ChartCard eyebrow="Monthly Trend" title="Abandonment Rate" accentColor="#e11d48">
          <TrendLineChart
            data={abandonmentTrend}
            color="#e11d48"
            label="Abandonment Rate"
            valueFormatter={(v) => `${v.toFixed(1)}%`}
            yAxisProps={{ domain: [0, 100], unit: '%' }}
          />
        </ChartCard>
        <ChartCard eyebrow="Monthly Trend" title="Escalation Rate" accentColor="#d97706">
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

function PercentBarChart({ data, color, radius = [4, 4, 0, 0], isDark = false }) {
  const [activeIndex, setActiveIndex] = useState(null);

  const axisTickFill = isDark ? '#8b8696' : '#6b6575';
  const axisStroke = isDark ? '#2a2a3a' : '#e8e3ed';
  const gridStroke = isDark ? '#2a2a3a' : '#e8e3ed';
  const tooltipBg = isDark ? '#16161f' : '#ffffff';
  const tooltipBorder = isDark ? '#2a2a3a' : '#e8e3ed';
  const tooltipColor = isDark ? '#f1eff5' : '#322D3C';
  const cursorFill = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(103,61,125,0.05)';

  const axisTick = { fill: axisTickFill, fontSize: 11 };
  const axisLine = { stroke: axisStroke };

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 32, right: 8, bottom: 4, left: 0 }}>
        <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={axisTick} axisLine={axisLine} tickLine={axisLine} />
        <YAxis domain={[0, 100]} unit="%" tick={axisTick} axisLine={axisLine} tickLine={axisLine} />
        <Tooltip
          cursor={{ fill: cursorFill }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0]?.payload;
            if (!d) return null;
            return (
              <div
                style={{
                  background: tooltipBg,
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: 12,
                  color: tooltipColor,
                  lineHeight: 1.7,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
                <div>Success Rate: <strong>{(d.successRate ?? 0).toFixed(1)}%</strong></div>
                <div>Share of Calls: <strong>{(d.callShare ?? 0).toFixed(1)}%</strong></div>
                <div>Total Calls: <strong>{(d.totalCalls ?? 0).toLocaleString()}</strong></div>
              </div>
            );
          }}
        />
        <Bar
          dataKey="successRate"
          radius={radius}
          animationDuration={800}
          animationEasing="ease-out"
          onMouseEnter={(_, index) => setActiveIndex(index)}
          onMouseLeave={() => setActiveIndex(null)}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${entry.name}`}
              fill={color}
              fillOpacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
            />
          ))}
          <LabelList
            dataKey="callShare"
            position="top"
            content={({ x, y, width, value }) => {
              if (value == null) return null;
              return (
                <text
                  x={Number(x) + Number(width) / 2}
                  y={Number(y) - 6}
                  textAnchor="middle"
                  fontSize={11}
                  fill={axisTickFill}
                  fontFamily="var(--font-dm-sans), sans-serif"
                >
                  {Number(value).toFixed(1)}%
                </text>
              );
            }}
          />
        </Bar>
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
          dot={{ r: 4, fill: color, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: color, stroke: '#ffffff', strokeWidth: 2 }}
          connectNulls={false}
          animationDuration={800}
          animationEasing="ease-out"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
