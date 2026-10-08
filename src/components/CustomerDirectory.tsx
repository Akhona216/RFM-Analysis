import React, { useState } from 'react';
import {
  CustomerRFM,
  SEGMENT_DEFINITIONS,
  SegmentId,
  RFMThresholds,
} from '../data/rfmEngine';
import { Search, ArrowUpDown, SlidersHorizontal, X } from 'lucide-react';

interface CustomerDirectoryProps {
  customers: CustomerRFM[];
  selectedSegment: SegmentId | 'all';
  onSelectSegment: (segment: SegmentId | 'all') => void;
  selectedCustomer: CustomerRFM | null;
  onSelectCustomer: (customer: CustomerRFM | null) => void;
  thresholds: RFMThresholds;
  onUpdateThresholds: (next: RFMThresholds) => void;
  onResetThresholds: () => void;
  onRecordCustomerOrder: (customerId: string, amount: number) => void;
}

type SortKey = 'monetary' | 'recencyDays' | 'frequency' | 'rfmComposite';

export const CustomerDirectory: React.FC<CustomerDirectoryProps> = ({
  customers,
  selectedSegment,
  onSelectSegment,
  selectedCustomer,
  onSelectCustomer,
  thresholds,
  onUpdateThresholds,
  onResetThresholds,
  onRecordCustomerOrder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('monetary');
  const [sortAsc, setSortAsc] = useState(false);
  const [showThresholdConfig, setShowThresholdConfig] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === 'recencyDays'); // default ascending for recency (lower days = better)
    }
  };

  const filtered = customers
    .filter((c) => {
      if (selectedSegment !== 'all' && c.segment !== selectedSegment) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.customerName.toLowerCase().includes(q) ||
        c.customerId.toLowerCase().includes(q) ||
        c.customerEmail.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q) ||
        c.rfmCode.includes(q)
      );
    })
    .sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      return sortAsc ? valA - valB : valB - valA;
    });

  const segmentOrder: SegmentId[] = [
    'champions',
    'loyal',
    'potential_loyalist',
    'new_customers',
    'churn_risk',
    'hibernating',
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Customer RFM Score Directory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Individual Recency (R), Frequency (F), and Monetary (M) quintile scores across {filtered.length} active profiles
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, ID, region, or RFM (e.g. 555)..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 w-64"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowThresholdConfig(!showThresholdConfig)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
              showThresholdConfig
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Scoring Quintiles</span>
          </button>
        </div>
      </div>

      {/* Optional Scoring Thresholds Calibration Bar */}
      {showThresholdConfig && (
        <div className="my-4 p-4 bg-slate-50 border border-slate-200 rounded-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-xs font-semibold text-slate-900">
                RFM Quintile Breakpoint Calibration
              </h3>
              <p className="text-xs text-slate-500">
                Adjust the cutoff boundaries for Score 5 (Best) vs Score 2 (At Risk) to dynamically re-segment customers
              </p>
            </div>
            <button
              type="button"
              onClick={onResetThresholds}
              className="text-xs font-medium text-slate-700 underline underline-offset-4 hover:text-slate-900"
            >
              Restore Defaults
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-3 text-xs">
            {/* Recency Score=5 Cutoff */}
            <div>
              <div className="flex justify-between font-medium text-slate-700">
                <span>Recency Score 5 Cutoff (≤ Days)</span>
                <span className="font-mono-tabular">{thresholds.recencyDays[0]}d</span>
              </div>
              <input
                type="range"
                min={5}
                max={28}
                value={thresholds.recencyDays[0]}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  onUpdateThresholds({
                    ...thresholds,
                    recencyDays: [
                      v,
                      Math.max(v + 12, thresholds.recencyDays[1]),
                      thresholds.recencyDays[2],
                      thresholds.recencyDays[3],
                    ],
                  });
                }}
                className="w-full mt-2 accent-slate-900"
              />
              <div className="text-[11px] text-slate-400 mt-1 font-mono-tabular">
                Breakpoints: ≤{thresholds.recencyDays[0]}d (5) · ≤{thresholds.recencyDays[1]}d (4) · ≤{thresholds.recencyDays[2]}d (3) · ≤{thresholds.recencyDays[3]}d (2)
              </div>
            </div>

            {/* Frequency Score=5 Cutoff */}
            <div>
              <div className="flex justify-between font-medium text-slate-700">
                <span>Frequency Score 5 Cutoff (≥ Orders)</span>
                <span className="font-mono-tabular">{thresholds.frequencyCount[3]} orders</span>
              </div>
              <input
                type="range"
                min={6}
                max={14}
                value={thresholds.frequencyCount[3]}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  onUpdateThresholds({
                    ...thresholds,
                    frequencyCount: [
                      thresholds.frequencyCount[0],
                      thresholds.frequencyCount[1],
                      Math.min(v - 1, thresholds.frequencyCount[2]),
                      v,
                    ],
                  });
                }}
                className="w-full mt-2 accent-slate-900"
              />
              <div className="text-[11px] text-slate-400 mt-1 font-mono-tabular">
                Breakpoints: ≥{thresholds.frequencyCount[3]} (5) · ≥{thresholds.frequencyCount[2]} (4) · ≥{thresholds.frequencyCount[1]} (3) · ≥{thresholds.frequencyCount[0]} (2)
              </div>
            </div>

            {/* Monetary Score=5 Cutoff */}
            <div>
              <div className="flex justify-between font-medium text-slate-700">
                <span>Monetary Score 5 Cutoff (≥ LTV $)</span>
                <span className="font-mono-tabular">${thresholds.monetarySpend[3]}</span>
              </div>
              <input
                type="range"
                min={1600}
                max={4500}
                step={100}
                value={thresholds.monetarySpend[3]}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  onUpdateThresholds({
                    ...thresholds,
                    monetarySpend: [
                      thresholds.monetarySpend[0],
                      thresholds.monetarySpend[1],
                      Math.min(v - 300, thresholds.monetarySpend[2]),
                      v,
                    ],
                  });
                }}
                className="w-full mt-2 accent-slate-900"
              />
              <div className="text-[11px] text-slate-400 mt-1 font-mono-tabular">
                Breakpoints: ≥${thresholds.monetarySpend[3]} (5) · ≥${thresholds.monetarySpend[2]} (4) · ≥${thresholds.monetarySpend[1]} (3) · ≥${thresholds.monetarySpend[0]} (2)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Segment Filter Bar */}
      <div className="mt-4 flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-md w-fit">
        <button
          type="button"
          onClick={() => onSelectSegment('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
            selectedSegment === 'all'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Customers ({customers.length})
        </button>
        {segmentOrder.map((segId) => {
          const meta = SEGMENT_DEFINITIONS[segId];
          const count = customers.filter((c) => c.segment === segId).length;
          return (
            <button
              key={segId}
              type="button"
              onClick={() => onSelectSegment(segId)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                selectedSegment === segId
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {meta.shortLabel} ({count})
            </button>
          );
        })}
      </div>

      {/* High-Density Customer Data Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-xs text-slate-500">
              <th className="py-2.5 pr-4 font-medium">Customer Profile</th>
              <th className="py-2.5 px-3 font-medium">Assigned Segment</th>
              <th className="py-2.5 px-3 font-medium text-right">
                <button
                  type="button"
                  onClick={() => handleSort('recencyDays')}
                  className="inline-flex items-center gap-1 hover:text-slate-900"
                >
                  <span>Recency (Days)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2.5 px-3 font-medium text-right">
                <button
                  type="button"
                  onClick={() => handleSort('frequency')}
                  className="inline-flex items-center gap-1 hover:text-slate-900"
                >
                  <span>Frequency</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2.5 px-3 font-medium text-right">
                <button
                  type="button"
                  onClick={() => handleSort('monetary')}
                  className="inline-flex items-center gap-1 hover:text-slate-900"
                >
                  <span>Monetary (LTV)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2.5 px-3 font-medium text-right">
                <button
                  type="button"
                  onClick={() => handleSort('rfmComposite')}
                  className="inline-flex items-center gap-1 hover:text-slate-900"
                >
                  <span>RFM Vector</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2.5 pl-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filtered.map((cust) => {
              const segMeta = SEGMENT_DEFINITIONS[cust.segment];
              const isSelected = selectedCustomer?.customerId === cust.customerId;
              return (
                <tr
                  key={cust.customerId}
                  onClick={() => onSelectCustomer(cust)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'bg-slate-100/90' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="py-2.5 pr-4">
                    <div className="font-semibold text-slate-900">
                      {cust.customerName}
                    </div>
                    <div className="text-slate-400 font-mono-tabular mt-0.5">
                      {cust.customerId} · {cust.region} · {cust.preferredCategory}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className="font-semibold"
                      style={{ color: segMeta.accentColor }}
                    >
                      {segMeta.name}
                    </span>
                    <div className="text-slate-400 text-[11px]">
                      Risk: {segMeta.retentionRisk}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono-tabular whitespace-nowrap">
                    <span className="font-medium text-slate-900">
                      {cust.recencyDays}d ago
                    </span>
                    <span className="text-slate-400 ml-1.5">(R={cust.rScore})</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono-tabular whitespace-nowrap">
                    <span className="font-medium text-slate-900">
                      {cust.frequency} orders
                    </span>
                    <span className="text-slate-400 ml-1.5">(F={cust.fScore})</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono-tabular whitespace-nowrap">
                    <span className="font-semibold text-slate-900">
                      ${cust.monetary.toLocaleString()}
                    </span>
                    <span className="text-slate-400 ml-1.5">(M={cust.mScore})</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono-tabular whitespace-nowrap">
                    <span className="font-semibold text-slate-900">
                      {cust.rScore}-{cust.fScore}-{cust.mScore}
                    </span>
                    <span className="text-slate-400 ml-1.5">
                      ({cust.rfmComposite.toFixed(1)})
                    </span>
                  </td>
                  <td
                    className="py-2.5 pl-3 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onRecordCustomerOrder(cust.customerId, 350)}
                      className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors whitespace-nowrap"
                    >
                      + Log $350 Order
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                  No customer profiles match your current filter or search query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-Over / Modal Inspector for Selected Customer */}
      {selectedCustomer && (
        <div className="mt-6 pt-6 border-t border-slate-200 bg-slate-50/70 -mx-6 -mb-6 p-6 rounded-b-lg">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono-tabular">
                <span>{selectedCustomer.customerId}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedCustomer.customerEmail}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedCustomer.region}</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mt-1">
                {selectedCustomer.customerName} —{' '}
                <span
                  style={{
                    color: SEGMENT_DEFINITIONS[selectedCustomer.segment].accentColor,
                  }}
                >
                  {SEGMENT_DEFINITIONS[selectedCustomer.segment].name}
                </span>
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onRecordCustomerOrder(selectedCustomer.customerId, 420)
                }
                className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors whitespace-nowrap"
              >
                Simulate Instant $420 Checkout
              </button>
              <button
                type="button"
                onClick={() => onSelectCustomer(null)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded"
                aria-label="Close customer inspector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
            {/* Score Breakdown & Next-Best Action */}
            <div className="lg:col-span-5 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-white border border-slate-200 rounded">
                  <div className="text-xs text-slate-500">Recency (R={selectedCustomer.rScore})</div>
                  <div className="text-lg font-semibold font-mono-tabular text-slate-900 mt-0.5">
                    {selectedCustomer.recencyDays}d
                  </div>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded">
                  <div className="text-xs text-slate-500">Frequency (F={selectedCustomer.fScore})</div>
                  <div className="text-lg font-semibold font-mono-tabular text-slate-900 mt-0.5">
                    {selectedCustomer.frequency}
                  </div>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded">
                  <div className="text-xs text-slate-500">Monetary (M={selectedCustomer.mScore})</div>
                  <div className="text-lg font-semibold font-mono-tabular text-slate-900 mt-0.5">
                    ${selectedCustomer.monetary.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded text-xs space-y-2">
                <div className="font-semibold text-slate-900">
                  Tailored Next-Best Marketing Action
                </div>
                <p className="text-slate-600">
                  {
                    SEGMENT_DEFINITIONS[selectedCustomer.segment].marketingPlaybook
                      .recommendedAction
                  }
                </p>
                <div className="text-slate-500 font-mono-tabular pt-1 border-t border-slate-100">
                  Offer: {SEGMENT_DEFINITIONS[selectedCustomer.segment].marketingPlaybook.offerStructure}
                </div>
              </div>
            </div>

            {/* Individual Customer Order History */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded p-4">
              <div className="text-xs font-semibold text-slate-900 pb-2 border-b border-slate-100 flex justify-between">
                <span>Validated Order Ledger ({selectedCustomer.transactions.length} orders)</span>
                <span className="font-mono-tabular text-slate-500">
                  Avg Order Value: ${selectedCustomer.avgOrderValue}
                </span>
              </div>
              <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 text-xs mt-1">
                {selectedCustomer.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="py-2 flex items-center justify-between gap-2"
                  >
                    <div className="font-mono-tabular text-slate-700">
                      <span className="font-medium text-slate-900">{tx.invoiceNo}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{tx.timestamp.slice(0, 10)}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{tx.category}</span>
                    </div>
                    <div className="font-mono-tabular font-semibold text-slate-900">
                      ${tx.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
