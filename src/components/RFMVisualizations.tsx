import React, { useState } from 'react';
import {
  CustomerRFM,
  SEGMENT_DEFINITIONS,
  SegmentId,
  classifySegment,
} from '../data/rfmEngine';

interface RFMVisualizationsProps {
  customers: CustomerRFM[];
  selectedSegment: SegmentId | 'all';
  onSelectSegment: (segment: SegmentId | 'all') => void;
  onSelectCustomer: (customer: CustomerRFM) => void;
}

export const RFMVisualizations: React.FC<RFMVisualizationsProps> = ({
  customers,
  selectedSegment,
  onSelectSegment,
  onSelectCustomer,
}) => {
  const [hoveredCustomer, setHoveredCustomer] = useState<CustomerRFM | null>(null);
  const [activeChartTab, setActiveChartTab] = useState<'matrix' | 'scatter'>('matrix');

  const totalRevenue = customers.reduce((sum, c) => sum + c.monetary, 0) || 1;
  const totalCustomers = customers.length || 1;

  // Build 5x5 matrix cells: Frequency (5 down to 1) x Recency (1 to 5)
  const fScores: (1 | 2 | 3 | 4 | 5)[] = [5, 4, 3, 2, 1];
  const rScores: (1 | 2 | 3 | 4 | 5)[] = [1, 2, 3, 4, 5];

  // Segment aggregation
  const segmentOrder: SegmentId[] = [
    'champions',
    'loyal',
    'potential_loyalist',
    'new_customers',
    'churn_risk',
    'hibernating',
  ];

  const segmentStats = segmentOrder.map((segId) => {
    const group = customers.filter((c) => c.segment === segId);
    const revenue = group.reduce((s, c) => s + c.monetary, 0);
    const avgRecency =
      group.length > 0
        ? Math.round(group.reduce((s, c) => s + c.recencyDays, 0) / group.length)
        : 0;
    const avgFreq =
      group.length > 0
        ? (group.reduce((s, c) => s + c.frequency, 0) / group.length).toFixed(1)
        : '0.0';
    const avgMonetary =
      group.length > 0 ? Math.round(revenue / group.length) : 0;

    return {
      meta: SEGMENT_DEFINITIONS[segId],
      count: group.length,
      countPct: ((group.length / totalCustomers) * 100).toFixed(1),
      revenue,
      revenuePct: ((revenue / totalRevenue) * 100).toFixed(1),
      avgRecency,
      avgFreq,
      avgMonetary,
    };
  });

  // Scatter plot scales
  const maxRecency = Math.max(180, ...customers.map((c) => c.recencyDays));
  const maxMonetary = Math.max(4500, ...customers.map((c) => c.monetary));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left 7 Cols: 5x5 Recency-Frequency Matrix OR R-M Behavioral Scatter Plot */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                RFM Cohort Topology & Behavioral Distribution
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any segment zone or customer node to filter downstream records and playbooks
              </p>
            </div>

            {/* Interactive View Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
              <button
                type="button"
                onClick={() => setActiveChartTab('matrix')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                  activeChartTab === 'matrix'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                5×5 R×F Grid
              </button>
              <button
                type="button"
                onClick={() => setActiveChartTab('scatter')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                  activeChartTab === 'scatter'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Recency × Monetary Plot
              </button>
            </div>
          </div>

          {activeChartTab === 'matrix' ? (
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>Y-Axis: Frequency Score (1 = Single Order · 5 = Top Repeat)</span>
                <span>X-Axis: Recency Score (1 = Lapsed · 5 = Active Today)</span>
              </div>

              {/* 5x5 Matrix Table */}
              <div className="overflow-x-auto">
                <div className="min-w-[520px]">
                  <div className="grid grid-cols-6 gap-1.5">
                    {/* Header Row */}
                    <div className="flex items-end justify-start pb-1 text-xs font-medium text-slate-400">
                      F \ R
                    </div>
                    {rScores.map((r) => (
                      <div
                        key={`r-head-${r}`}
                        className="text-center pb-1 text-xs font-mono-tabular font-medium text-slate-600"
                      >
                        R = {r}
                      </div>
                    ))}

                    {/* Matrix Rows */}
                    {fScores.map((f) => (
                      <React.Fragment key={`f-row-${f}`}>
                        <div className="flex items-center justify-start pr-2 text-xs font-mono-tabular font-medium text-slate-600">
                          F = {f}
                        </div>
                        {rScores.map((r) => {
                          const cellCustomers = customers.filter(
                            (c) => c.rScore === r && c.fScore === f
                          );
                          const cellRevenue = cellCustomers.reduce(
                            (s, c) => s + c.monetary,
                            0
                          );
                          // Representative segment assuming M=4 for high F, M=2 for low F
                          const repM: 1 | 2 | 3 | 4 | 5 = f >= 4 ? 4 : f >= 2 ? 3 : 2;
                          const cellSegmentId = classifySegment(r, f, repM);
                          const segMeta = SEGMENT_DEFINITIONS[cellSegmentId];
                          const isSelected =
                            selectedSegment === 'all' || selectedSegment === cellSegmentId;

                          return (
                            <button
                              key={`cell-${r}-${f}`}
                              type="button"
                              onClick={() =>
                                onSelectSegment(
                                  selectedSegment === cellSegmentId ? 'all' : cellSegmentId
                                )
                              }
                              className={`text-left p-2.5 rounded border transition-all flex flex-col justify-between min-h-[72px] ${
                                segMeta.bgTint
                              } ${segMeta.borderTint} ${
                                isSelected
                                  ? 'opacity-100 hover:brightness-95'
                                  : 'opacity-35 hover:opacity-75'
                              }`}
                            >
                              <div className="flex items-baseline justify-between gap-1 w-full">
                                <span
                                  className={`text-[11px] font-semibold truncate ${segMeta.textTint}`}
                                >
                                  {segMeta.shortLabel}
                                </span>
                                <span className="text-xs font-mono-tabular font-semibold text-slate-900">
                                  {cellCustomers.length}
                                </span>
                              </div>
                              <div className="mt-2 flex items-baseline justify-between text-[11px] font-mono-tabular text-slate-600">
                                <span>
                                  {cellRevenue > 0
                                    ? `$${(cellRevenue / 1000).toFixed(1)}k`
                                    : '$0'}
                                </span>
                                <span className="text-slate-400">
                                  {Math.round((cellCustomers.length / totalCustomers) * 100)}%
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 relative">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>Y-Axis: Cumulative Monetary Spend ($ USD)</span>
                <span>Bubble Size: Order Frequency · X-Axis: Recency (Days Ago)</span>
              </div>

              <div className="relative border border-slate-200 rounded bg-slate-50/50 p-3">
                <svg
                  viewBox="0 0 600 310"
                  className="w-full h-[290px] overflow-visible select-none"
                >
                  {/* Horizontal Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = 270 - ratio * 240;
                    const val = Math.round(ratio * maxMonetary);
                    return (
                      <g key={`h-grid-${ratio}`}>
                        <line
                          x1={54}
                          y1={y}
                          x2={575}
                          y2={y}
                          stroke="#E2E8F0"
                          strokeDasharray={ratio === 0 ? undefined : '3 3'}
                        />
                        <text
                          x={46}
                          y={y + 4}
                          textAnchor="end"
                          className="text-[10px] fill-slate-400 font-mono"
                        >
                          ${val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Vertical Grid Lines (Recency Days) */}
                  {[0, 30, 60, 90, 120, 150, 180].map((days) => {
                    const x = 54 + (days / maxRecency) * 520;
                    return (
                      <g key={`v-grid-${days}`}>
                        <line
                          x1={x}
                          y1={30}
                          x2={x}
                          y2={270}
                          stroke="#E2E8F0"
                          strokeDasharray={days === 0 ? undefined : '3 3'}
                        />
                        <text
                          x={x}
                          y={288}
                          textAnchor="middle"
                          className="text-[10px] fill-slate-400 font-mono"
                        >
                          {days}d
                        </text>
                      </g>
                    );
                  })}

                  {/* Churn Risk Threshold Divider at 65 days */}
                  <line
                    x1={54 + (65 / maxRecency) * 520}
                    y1={25}
                    x2={54 + (65 / maxRecency) * 520}
                    y2={270}
                    stroke="#D97706"
                    strokeWidth={1.25}
                    strokeDasharray="4 4"
                  />
                  <text
                    x={54 + (65 / maxRecency) * 520 + 6}
                    y={36}
                    className="text-[10px] fill-amber-700 font-medium"
                  >
                    65d Lapse Threshold →
                  </text>

                  {/* Customer Nodes */}
                  {customers.map((cust) => {
                    const cx =
                      54 + Math.min(1, cust.recencyDays / maxRecency) * 520;
                    const cy =
                      270 - Math.min(1, cust.monetary / maxMonetary) * 240;
                    const radius = Math.max(5, Math.min(14, 4 + cust.frequency * 0.9));
                    const segMeta = SEGMENT_DEFINITIONS[cust.segment];
                    const isDimmed =
                      selectedSegment !== 'all' && selectedSegment !== cust.segment;

                    return (
                      <circle
                        key={cust.customerId}
                        cx={cx}
                        cy={cy}
                        r={radius}
                        fill={segMeta.accentColor}
                        fillOpacity={isDimmed ? 0.18 : 0.78}
                        stroke="#FFFFFF"
                        strokeWidth={1.5}
                        className="cursor-pointer transition-opacity duration-150 hover:fill-opacity-100"
                        onMouseEnter={() => setHoveredCustomer(cust)}
                        onMouseLeave={() => setHoveredCustomer(null)}
                        onClick={() => onSelectCustomer(cust)}
                      />
                    );
                  })}
                </svg>

                {/* Hover Readout Bar */}
                <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 min-h-[24px]">
                  {hoveredCustomer ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        {hoveredCustomer.customerName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {SEGMENT_DEFINITIONS[hoveredCustomer.segment].name}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">
                        Recency: {hoveredCustomer.recencyDays}d
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">
                        Orders: {hoveredCustomer.frequency}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular font-semibold text-slate-900">
                        Spend: ${hoveredCustomer.monetary.toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400">
                      Hover over any customer bubble to inspect RFM coordinates, or click to open full transaction history.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Legend & Filter Reset */}
        <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-4">
            {segmentOrder.map((segId) => {
              const meta = SEGMENT_DEFINITIONS[segId];
              const active = selectedSegment === segId;
              return (
                <button
                  key={segId}
                  type="button"
                  onClick={() =>
                    onSelectSegment(selectedSegment === segId ? 'all' : segId)
                  }
                  className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                    active
                      ? 'font-semibold text-slate-900 underline underline-offset-4'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-xs shrink-0"
                    style={{ backgroundColor: meta.accentColor }}
                  />
                  <span>{meta.shortLabel}</span>
                </button>
              );
            })}
          </div>
          {selectedSegment !== 'all' && (
            <button
              type="button"
              onClick={() => onSelectSegment('all')}
              className="text-xs font-medium text-slate-900 underline underline-offset-4 hover:text-slate-600"
            >
              Reset Segment Filter
            </button>
          )}
        </div>
      </div>

      {/* Right 5 Cols: Cohort Revenue Share & Behavioral Breakdown */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between">
        <div>
          <div className="pb-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">
              Segment Revenue vs. Customer Share
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparing cohort headcount proportion against lifetime monetary contribution
            </p>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {segmentStats.map((item) => {
              const isSelected = selectedSegment === item.meta.id;
              return (
                <div
                  key={item.meta.id}
                  onClick={() =>
                    onSelectSegment(
                      selectedSegment === item.meta.id ? 'all' : item.meta.id
                    )
                  }
                  className={`py-3 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-50 -mx-3 px-3 rounded'
                      : 'hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-xs shrink-0"
                        style={{ backgroundColor: item.meta.accentColor }}
                      />
                      <span className="text-sm font-semibold text-slate-900">
                        {item.meta.name}
                      </span>
                      <span className="text-xs text-slate-400 font-mono-tabular">
                        ({item.count} cust · {item.countPct}%)
                      </span>
                    </div>
                    <div className="text-right font-mono-tabular">
                      <span className="text-sm font-semibold text-slate-900">
                        ${item.revenue.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-500 ml-1.5">
                        ({item.revenuePct}%)
                      </span>
                    </div>
                  </div>

                  {/* Dual Progress Bar: Revenue % vs Customer Headcount % */}
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-14 text-[11px] text-slate-400">Revenue</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-xs overflow-hidden">
                        <div
                          className="h-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, Number(item.revenuePct))}%`,
                            backgroundColor: item.meta.accentColor,
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-14 text-[11px] text-slate-400">Customers</span>
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-xs overflow-hidden">
                        <div
                          className="h-full bg-slate-400/70 transition-all duration-300"
                          style={{
                            width: `${Math.min(100, Number(item.countPct))}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Unboxed Behavioral Averages */}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono-tabular">
                    <span>Avg R: {item.avgRecency}d</span>
                    <span aria-hidden="true">·</span>
                    <span>Avg F: {item.avgFreq} orders</span>
                    <span aria-hidden="true">·</span>
                    <span>Avg LTV: ${item.avgMonetary.toLocaleString()}</span>
                    <span aria-hidden="true">·</span>
                    <span>Risk: {item.meta.retentionRisk}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Pareto concentration ratio</span>
          <span className="font-mono-tabular font-medium text-slate-800">
            Top 2 segments drive{' '}
            {(
              Number(segmentStats[0]?.revenuePct || 0) +
              Number(segmentStats[1]?.revenuePct || 0)
            ).toFixed(1)}
            % of total revenue
          </span>
        </div>
      </div>
    </div>
  );
};
