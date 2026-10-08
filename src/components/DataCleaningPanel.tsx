import React, { useState } from 'react';
import {
  CleaningConfig,
  CleaningPipelineResult,
  RawTransaction,
  AnomalyType,
} from '../data/rfmEngine';

interface DataCleaningPanelProps {
  cleaningConfig: CleaningConfig;
  onUpdateConfig: (next: CleaningConfig) => void;
  pipelineResult: CleaningPipelineResult;
  onInjectAnomalySample: () => void;
}

const ANOMALY_LABELS: Record<AnomalyType, string> = {
  valid: 'Verified Valid',
  duplicate_invoice: 'Duplicate Invoice ID',
  missing_customer_id: 'Missing Customer ID',
  negative_amount: 'Negative / Credit Memo',
  invalid_date: 'Malformed Timestamp',
  outlier_amount: 'Extreme Spend Outlier',
};

export const DataCleaningPanel: React.FC<DataCleaningPanelProps> = ({
  cleaningConfig,
  onUpdateConfig,
  pipelineResult,
  onInjectAnomalySample,
}) => {
  const [ledgerFilter, setLedgerFilter] = useState<'all_anomalies' | 'rejected' | 'cleaned'>('all_anomalies');

  const toggleRule = (key: keyof Omit<CleaningConfig, 'outlierCapThreshold'>) => {
    onUpdateConfig({
      ...cleaningConfig,
      [key]: !cleaningConfig[key],
    });
  };

  const combinedTransactions = [
    ...pipelineResult.rejectedTransactions,
    ...pipelineResult.cleanedTransactions,
  ];

  const displayedRows = combinedTransactions.filter((tx) => {
    if (ledgerFilter === 'all_anomalies') return tx.anomalyType !== 'valid';
    if (ledgerFilter === 'rejected') return Boolean(tx.isCleanedOut);
    return !tx.isCleanedOut;
  });

  const { stats } = pipelineResult;
  const dataHealthRate =
    stats.totalRaw > 0
      ? ((stats.totalValid / stats.totalRaw) * 100).toFixed(1)
      : '100.0';

  return (
    <div className="space-y-6">
      {/* Summary Metrics Strip */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Transactional Data Cleaning & Preparation Pipeline
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sanitize raw ERP and POS ingestion streams before computing Recency, Frequency, and Monetary quintiles
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onInjectAnomalySample}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
            >
              Simulate Dirty Webhook Batch
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 pt-5">
          <div>
            <div className="text-xs text-slate-500">Raw Ingested Rows</div>
            <div className="text-2xl font-semibold font-mono-tabular text-slate-900 mt-1">
              {stats.totalRaw}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Total stream events</div>
          </div>

          <div>
            <div className="text-xs text-slate-500">Clean Validated Rows</div>
            <div className="text-2xl font-semibold font-mono-tabular text-teal-700 mt-1">
              {stats.totalValid}
            </div>
            <div className="text-xs text-slate-400 mt-0.5 font-mono-tabular">
              {dataHealthRate}% pass rate
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500">Duplicates Removed</div>
            <div className="text-2xl font-semibold font-mono-tabular text-slate-900 mt-1">
              {stats.duplicatesRemoved}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Invoice ID collisions</div>
          </div>

          <div>
            <div className="text-xs text-slate-500">Null Customer IDs</div>
            <div className="text-2xl font-semibold font-mono-tabular text-slate-900 mt-1">
              {stats.missingIdsDropped}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Unattributed POS leaks</div>
          </div>

          <div>
            <div className="text-xs text-slate-500">Negative Returns</div>
            <div className="text-2xl font-semibold font-mono-tabular text-slate-900 mt-1">
              {stats.negativeExcluded}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Reversals & chargebacks</div>
          </div>

          <div>
            <div className="text-xs text-slate-500">Dates & Outliers Fixed</div>
            <div className="text-2xl font-semibold font-mono-tabular text-slate-900 mt-1">
              {stats.datesNormalized + stats.outliersCapped}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Normalized in-place</div>
          </div>
        </div>
      </div>

      {/* Rules Configuration + Anomaly Inspection Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Active Sanitization Rules */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-200">
            Active Sanitization Rules (Live Recalculation)
          </h3>

          <div className="divide-y divide-slate-100 mt-2">
            <label className="py-3.5 flex items-start justify-between gap-4 cursor-pointer">
              <div>
                <div className="text-sm font-medium text-slate-900">
                  1. Deduplicate Identical Invoice Numbers
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Prevents webhook retries from artificially inflating customer Frequency (F) and Monetary (M) scores.
                </div>
              </div>
              <input
                type="checkbox"
                checked={cleaningConfig.removeDuplicates}
                onChange={() => toggleRule('removeDuplicates')}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
            </label>

            <label className="py-3.5 flex items-start justify-between gap-4 cursor-pointer">
              <div>
                <div className="text-sm font-medium text-slate-900">
                  2. Drop Unattributed Null Customer IDs
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Excludes anonymous POS guest transactions that cannot be tied to an individual lifecycle profile.
                </div>
              </div>
              <input
                type="checkbox"
                checked={cleaningConfig.dropMissingCustomerIds}
                onChange={() => toggleRule('dropMissingCustomerIds')}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
            </label>

            <label className="py-3.5 flex items-start justify-between gap-4 cursor-pointer">
              <div>
                <div className="text-sm font-medium text-slate-900">
                  3. Exclude Negative Credit Memos & Reversals
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Filters out refund ledger entries so return events do not register as recent positive purchases.
                </div>
              </div>
              <input
                type="checkbox"
                checked={cleaningConfig.excludeNegativeReturns}
                onChange={() => toggleRule('excludeNegativeReturns')}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
            </label>

            <label className="py-3.5 flex items-start justify-between gap-4 cursor-pointer">
              <div>
                <div className="text-sm font-medium text-slate-900">
                  4. Repair Malformed ISO Timestamps
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Normalizes corrupted legacy ERP date strings to valid ISO-8601 timestamps instead of NaN recency.
                </div>
              </div>
              <input
                type="checkbox"
                checked={cleaningConfig.fixMalformedDates}
                onChange={() => toggleRule('fixMalformedDates')}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
            </label>

            <div className="py-3.5">
              <label className="flex items-start justify-between gap-4 cursor-pointer">
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    5. Winsorize Extreme Monetary Outliers
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Caps anomalous single-order spikes at ${cleaningConfig.outlierCapThreshold.toLocaleString()} so one-off wholesale glitches do not skew quintiles.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={cleaningConfig.capExtremeOutliers}
                  onChange={() => toggleRule('capExtremeOutliers')}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
              </label>

              {cleaningConfig.capExtremeOutliers && (
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    Outlier Cap ($):
                  </span>
                  <input
                    type="range"
                    min={1500}
                    max={10000}
                    step={500}
                    value={cleaningConfig.outlierCapThreshold}
                    onChange={(e) =>
                      onUpdateConfig({
                        ...cleaningConfig,
                        outlierCapThreshold: Number(e.target.value),
                      })
                    }
                    className="w-full accent-slate-900"
                  />
                  <span className="text-xs font-mono-tabular font-semibold text-slate-900 w-16 text-right">
                    ${cleaningConfig.outlierCapThreshold}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Anomaly & Sanitization Audit Log */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Transaction Hygiene Audit Log
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inspect flagged anomalies, quarantined records, and normalized fields
                </p>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
                <button
                  type="button"
                  onClick={() => setLedgerFilter('all_anomalies')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    ledgerFilter === 'all_anomalies'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Flagged Anomalies
                </button>
                <button
                  type="button"
                  onClick={() => setLedgerFilter('rejected')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    ledgerFilter === 'rejected'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Quarantined ({pipelineResult.rejectedTransactions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setLedgerFilter('cleaned')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    ledgerFilter === 'cleaned'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Clean Stream ({pipelineResult.cleanedTransactions.length})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="py-2.5 pr-3 font-medium">Invoice</th>
                    <th className="py-2.5 px-3 font-medium">Customer</th>
                    <th className="py-2.5 px-3 font-medium">Detected Issue</th>
                    <th className="py-2.5 px-3 font-medium">Disposition</th>
                    <th className="py-2.5 pl-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {displayedRows.slice(0, 12).map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 pr-3 font-mono-tabular font-medium text-slate-900 whitespace-nowrap">
                        {tx.invoiceNo}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-900">
                          {tx.customerName}
                        </div>
                        <div className="text-slate-400 font-mono-tabular">
                          {tx.customerId || 'NULL_ID'} · {tx.channel}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                        {ANOMALY_LABELS[tx.anomalyType]}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {tx.isCleanedOut ? (
                          <span className="text-red-700 font-medium">
                            Quarantined · Excluded
                          </span>
                        ) : tx.anomalyType !== 'valid' ? (
                          <span className="text-amber-700 font-medium">
                            Repaired · Included
                          </span>
                        ) : (
                          <span className="text-teal-700 font-medium">
                            Verified · Included
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pl-3 text-right font-mono-tabular font-semibold text-slate-900 whitespace-nowrap">
                        {tx.amount < 0
                          ? `-$${Math.abs(tx.amount).toLocaleString()}`
                          : `$${tx.amount.toLocaleString()}`}
                      </td>
                    </tr>
                  ))}
                  {displayedRows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                        No transactions match the selected audit filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {Math.min(12, displayedRows.length)} of {displayedRows.length} matching records
            </span>
            <span>
               Toggle checkboxes on the left to observe immediate impact on RFM segmentation
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
