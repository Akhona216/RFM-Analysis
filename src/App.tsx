import React, { useState, useEffect, useMemo } from 'react';
import {
  generateInitialTransactions,
  runDataCleaningPipeline,
  calculateCustomerRFM,
  createSimulatedLiveTransaction,
  DEFAULT_CLEANING_CONFIG,
  DEFAULT_RFM_THRESHOLDS,
  REFERENCE_DATE_ISO,
  RawTransaction,
  CleaningConfig,
  RFMThresholds,
  SegmentId,
  CustomerRFM,
  SEGMENT_DEFINITIONS,
} from './data/rfmEngine';
import { RFMVisualizations } from './components/RFMVisualizations';
import { DataCleaningPanel } from './components/DataCleaningPanel';
import { CustomerDirectory } from './components/CustomerDirectory';
import { MarketingPlaybooks } from './components/MarketingPlaybooks';

type ActiveSection = 'overview' | 'cleaning' | 'customers' | 'playbooks';

interface SegmentTransitionEvent {
  id: string;
  customerName: string;
  fromSegment: SegmentId;
  toSegment: SegmentId;
  amount: number;
  timestamp: string;
}

export default function App() {
  const [rawTransactions, setRawTransactions] = useState<RawTransaction[]>(() =>
    generateInitialTransactions()
  );
  const [cleaningConfig, setCleaningConfig] = useState<CleaningConfig>(
    DEFAULT_CLEANING_CONFIG
  );
  const [thresholds, setThresholds] = useState<RFMThresholds>(
    DEFAULT_RFM_THRESHOLDS
  );
  const [selectedSegment, setSelectedSegment] = useState<SegmentId | 'all'>('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ActiveSection>('overview');
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [streamStep, setStreamStep] = useState<number>(1);
  const [recentTransitions, setRecentTransitions] = useState<SegmentTransitionEvent[]>([]);

  // 1. Run cleaning & preparation pipeline
  const pipelineResult = useMemo(
    () => runDataCleaningPipeline(rawTransactions, cleaningConfig),
    [rawTransactions, cleaningConfig]
  );

  // 2. Calculate RFM metrics & segments
  const customers = useMemo(
    () =>
      calculateCustomerRFM(
        pipelineResult.cleanedTransactions,
        thresholds,
        REFERENCE_DATE_ISO
      ),
    [pipelineResult.cleanedTransactions, thresholds]
  );

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.customerId === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  );

  // Helper to inject a transaction and detect real-time segment transitions
  const appendTransactionWithTransitionCheck = (newTx: RawTransaction) => {
    setRawTransactions((prevRaw) => {
      const nextRaw = [newTx, ...prevRaw];
      if (newTx.customerId) {
        const prevClean = runDataCleaningPipeline(prevRaw, cleaningConfig);
        const prevCustomers = calculateCustomerRFM(
          prevClean.cleanedTransactions,
          thresholds,
          REFERENCE_DATE_ISO
        );
        const oldCust = prevCustomers.find((c) => c.customerId === newTx.customerId);

        const nextClean = runDataCleaningPipeline(nextRaw, cleaningConfig);
        const nextCustomers = calculateCustomerRFM(
          nextClean.cleanedTransactions,
          thresholds,
          REFERENCE_DATE_ISO
        );
        const updatedCust = nextCustomers.find(
          (c) => c.customerId === newTx.customerId
        );

        if (oldCust && updatedCust && oldCust.segment !== updatedCust.segment) {
          const transition: SegmentTransitionEvent = {
            id: `TR-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            customerName: updatedCust.customerName,
            fromSegment: oldCust.segment,
            toSegment: updatedCust.segment,
            amount: newTx.amount,
            timestamp: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
          };
          setRecentTransitions((prev) => [transition, ...prev.slice(0, 4)]);
        }
      }
      return nextRaw;
    });
  };

  // Real-time stream interval
  useEffect(() => {
    if (!isLiveStreaming) return;
    const timer = setInterval(() => {
      setStreamStep((prevStep) => {
        const nextStep = prevStep + 1;
        const simTx = createSimulatedLiveTransaction(customers, nextStep);
        appendTransactionWithTransitionCheck(simTx);
        return nextStep;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [isLiveStreaming, customers, cleaningConfig, thresholds]);

  // Record a manual order for a specific customer
  const handleRecordCustomerOrder = (customerId: string, amount: number) => {
    const target = customers.find((c) => c.customerId === customerId);
    if (!target) return;
    const invoiceNum = 88000 + rawTransactions.length + 1;
    const manualTx: RawTransaction = {
      id: `TX-MAN-${invoiceNum}`,
      invoiceNo: `INV-${invoiceNum}`,
      customerId: target.customerId,
      customerName: target.customerName,
      customerEmail: target.customerEmail,
      region: target.region,
      channel: 'Web Store',
      category: target.preferredCategory as RawTransaction['category'],
      timestamp: REFERENCE_DATE_ISO,
      amount,
      quantity: Math.max(1, Math.round(amount / 150)),
      anomalyType: 'valid',
    };
    appendTransactionWithTransitionCheck(manualTx);
  };

  // Inject dirty webhook sample batch
  const handleInjectAnomalySample = () => {
    const step = rawTransactions.length + 10;
    const dirtyTx: RawTransaction = {
      id: `TX-ANOMALY-${Date.now()}`,
      invoiceNo: `INV-84101`, // Duplicate collision
      customerId: 'CUST-1001',
      customerName: 'Elena Rostova',
      customerEmail: 'e.rostova@studio-kinesis.io',
      region: 'North America',
      channel: 'B2B Portal',
      category: 'Audio Hardware',
      timestamp: REFERENCE_DATE_ISO,
      amount: 480,
      quantity: 2,
      anomalyType: 'duplicate_invoice',
    };
    const negativeTx: RawTransaction = {
      id: `TX-ANOMALY-NEG-${step}`,
      invoiceNo: `INV-${89000 + step}`,
      customerId: 'CUST-1031',
      customerName: 'Rachel Greenwald',
      customerEmail: 'rgreenwald@apex-production.com',
      region: 'North America',
      channel: 'B2B Portal',
      category: 'Workspace Ergonomics',
      timestamp: REFERENCE_DATE_ISO,
      amount: -390,
      quantity: -1,
      anomalyType: 'negative_amount',
    };
    setRawTransactions((prev) => [dirtyTx, negativeTx, ...prev]);
  };

  // Export CSV helper
  const handleExportCsv = (segmentFilter: SegmentId | 'all' = 'all') => {
    const rows =
      segmentFilter === 'all'
        ? customers
        : customers.filter((c) => c.segment === segmentFilter);

    const headers = [
      'CustomerID',
      'Name',
      'Email',
      'Region',
      'Segment',
      'RecencyDays',
      'FrequencyOrders',
      'MonetarySpendUSD',
      'R_Score',
      'F_Score',
      'M_Score',
      'RFM_Vector',
    ];
    const csvLines = [
      headers.join(','),
      ...rows.map((c) =>
        [
          c.customerId,
          `"${c.customerName}"`,
          c.customerEmail,
          `"${c.region}"`,
          SEGMENT_DEFINITIONS[c.segment].name,
          c.recencyDays,
          c.frequency,
          c.monetary,
          c.rScore,
          c.fScore,
          c.mScore,
          c.rfmCode,
        ].join(',')
      ),
    ];

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `rfm_segments_${segmentFilter}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Executive KPIs
  const totalRevenue = customers.reduce((s, c) => s + c.monetary, 0);
  const championsAndLoyal = customers.filter(
    (c) => c.segment === 'champions' || c.segment === 'loyal'
  );
  const loyalRevenue = championsAndLoyal.reduce((s, c) => s + c.monetary, 0);
  const churnRiskCustomers = customers.filter((c) => c.segment === 'churn_risk');
  const churnRiskRevenue = churnRiskCustomers.reduce((s, c) => s + c.monetary, 0);
  const newCustomersCount = customers.filter(
    (c) => c.segment === 'new_customers'
  ).length;
  const latestTx = rawTransactions[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* Top Bar Contract: Strictly 1 row, 3 zones */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#overview"
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('overview');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap"
        >
          RFM Pulse
        </a>

        {/* Zone 2: 4 clean navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <a
            href="#overview"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('overview');
            }}
            className={`transition-colors whitespace-nowrap hover:text-slate-900 ${
              activeSection === 'overview'
                ? 'text-slate-900 underline underline-offset-8 decoration-2'
                : ''
            }`}
          >
            Overview & Matrix
          </a>
          <a
            href="#cleaning"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('cleaning');
            }}
            className={`transition-nowrap transition-colors hover:text-slate-900 ${
              activeSection === 'cleaning'
                ? 'text-slate-900 underline underline-offset-8 decoration-2'
                : ''
            }`}
          >
            Data Cleaning ({pipelineResult.rejectedTransactions.length} Quarantined)
          </a>
          <a
            href="#customers"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('customers');
            }}
            className={`transition-colors whitespace-nowrap hover:text-slate-900 ${
              activeSection === 'customers'
                ? 'text-slate-900 underline underline-offset-8 decoration-2'
                : ''
            }`}
          >
            Customer Directory ({customers.length})
          </a>
          <a
            href="#playbooks"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('playbooks');
            }}
            className={`transition-colors whitespace-nowrap hover:text-slate-900 ${
              activeSection === 'playbooks'
                ? 'text-slate-900 underline underline-offset-8 decoration-2'
                : ''
            }`}
          >
            Marketing Playbooks
          </a>
        </nav>

        {/* Zone 3: 2 primary actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            className={`px-3.5 py-2 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
              isLiveStreaming
                ? 'bg-teal-50 text-teal-900 border-teal-300 hover:bg-teal-100'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {isLiveStreaming ? 'Live Ingestion: Active' : 'Live Ingestion: Paused'}
          </button>
          <button
            type="button"
            onClick={() => handleExportCsv(selectedSegment)}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            Export RFM CSV
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-6 space-y-6">
        {/* Live Stream & Segment Transition Strip */}
        <div className="bg-white border border-slate-200 rounded-lg px-5 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-slate-600 font-mono-tabular">
            <span className="font-sans font-semibold text-slate-900">
              Latest Stream Event
            </span>
            <span aria-hidden="true">·</span>
            {latestTx ? (
              <>
                <span>{latestTx.invoiceNo}</span>
                <span aria-hidden="true">·</span>
                <span className="font-sans font-medium text-slate-800">
                  {latestTx.customerName}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {latestTx.amount < 0
                    ? `-$${Math.abs(latestTx.amount)}`
                    : `$${latestTx.amount}`}
                </span>
                <span aria-hidden="true">·</span>
                <span
                  className={
                    latestTx.anomalyType === 'valid'
                      ? 'text-teal-700 font-sans font-medium'
                      : 'text-amber-700 font-sans font-medium'
                  }
                >
                  {latestTx.anomalyType === 'valid'
                    ? 'Verified Valid'
                    : `Flagged: ${latestTx.anomalyType.replace(/_/g, ' ')}`}
                </span>
              </>
            ) : (
              <span>Awaiting transaction...</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-slate-600">
            {recentTransitions.length > 0 ? (
              <div className="flex items-center gap-2 font-mono-tabular">
                <span className="font-sans font-semibold text-teal-800">
                  Cohort Upgrade:
                </span>
                <span className="font-sans text-slate-900 font-medium">
                  {recentTransitions[0].customerName}
                </span>
                <span>
                  moved from{' '}
                  {SEGMENT_DEFINITIONS[recentTransitions[0].fromSegment].shortLabel} →{' '}
                  <strong className="text-slate-900">
                    {SEGMENT_DEFINITIONS[recentTransitions[0].toSegment].shortLabel}
                  </strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>{recentTransitions[0].timestamp}</span>
              </div>
            ) : (
              <span className="text-slate-400">
                Real-time RFM recalculation active — log an order or watch live stream to observe cohort transitions
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                const nextStep = streamStep + 1;
                setStreamStep(nextStep);
                const simTx = createSimulatedLiveTransaction(customers, nextStep);
                appendTransactionWithTransitionCheck(simTx);
              }}
              className="px-2.5 py-1 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded transition-colors whitespace-nowrap"
            >
              + Step Next Transaction
            </button>
          </div>
        </div>

        {/* Executive KPI Summary Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="text-xs text-slate-500">
              Validated Cohort Revenue
            </div>
            <div className="text-2xl font-semibold font-mono-tabular text-slate-900 mt-1">
              ${totalRevenue.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1.5 font-mono-tabular">
              <span>{pipelineResult.stats.totalValid} clean orders</span>
              <span aria-hidden="true"> · </span>
              <span>
                AOV $
                {pipelineResult.stats.totalValid > 0
                  ? Math.round(totalRevenue / pipelineResult.stats.totalValid)
                  : 0}
              </span>
            </div>
          </div>

          <div
            onClick={() =>
              setSelectedSegment(
                selectedSegment === 'champions' ? 'all' : 'champions'
              )
            }
            className="bg-white border border-slate-200 rounded-lg p-5 cursor-pointer hover:border-slate-300 transition-colors"
          >
            <div className="text-xs text-slate-500">
              Champions & Loyal Core
            </div>
            <div className="text-2xl font-semibold font-mono-tabular text-teal-800 mt-1">
              {championsAndLoyal.length} customers
            </div>
            <div className="text-xs text-slate-500 mt-1.5 font-mono-tabular">
              <span>${loyalRevenue.toLocaleString()} LTV</span>
              <span aria-hidden="true"> · </span>
              <span>
                {totalRevenue > 0
                  ? ((loyalRevenue / totalRevenue) * 100).toFixed(1)
                  : 0}
                % of revenue
              </span>
            </div>
          </div>

          <div
            onClick={() =>
              setSelectedSegment(
                selectedSegment === 'churn_risk' ? 'all' : 'churn_risk'
              )
            }
            className="bg-white border border-slate-200 rounded-lg p-5 cursor-pointer hover:border-slate-300 transition-colors"
          >
            <div className="text-xs text-slate-500">
              Churn Risk Revenue Exposure
            </div>
            <div className="text-2xl font-semibold font-mono-tabular text-amber-800 mt-1">
              ${churnRiskRevenue.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1.5 font-mono-tabular">
              <span>{churnRiskCustomers.length} high-value lapsed</span>
              <span aria-hidden="true"> · </span>
              <span>R ≤ 2</span>
            </div>
          </div>

          <div
            onClick={() =>
              setSelectedSegment(
                selectedSegment === 'new_customers' ? 'all' : 'new_customers'
              )
            }
            className="bg-white border border-slate-200 rounded-lg p-5 cursor-pointer hover:border-slate-300 transition-colors"
          >
            <div className="text-xs text-slate-500">
              New Onboarding Cohort
            </div>
            <div className="text-2xl font-semibold font-mono-tabular text-sky-800 mt-1">
              {newCustomersCount} customers
            </div>
            <div className="text-xs text-slate-500 mt-1.5 font-mono-tabular">
              <span>1st order ≤ 32d</span>
              <span aria-hidden="true"> · </span>
              <span>Target 2nd buy</span>
            </div>
          </div>

          <div
            onClick={() => setActiveSection('cleaning')}
            className="bg-white border border-slate-200 rounded-lg p-5 cursor-pointer hover:border-slate-300 transition-colors"
          >
            <div className="text-xs text-slate-500">
              Data Hygiene Pass Rate
            </div>
            <div className="text-2xl font-semibold font-mono-tabular text-slate-900 mt-1">
              {pipelineResult.stats.totalRaw > 0
                ? (
                    (pipelineResult.stats.totalValid /
                      pipelineResult.stats.totalRaw) *
                    100
                  ).toFixed(1)
                : '100.0'}
              %
            </div>
            <div className="text-xs text-slate-500 mt-1.5 font-mono-tabular">
              <span>
                {pipelineResult.rejectedTransactions.length} quarantined
              </span>
              <span aria-hidden="true"> · </span>
              <span>
                {pipelineResult.stats.datesNormalized +
                  pipelineResult.stats.outliersCapped}{' '}
                repaired
              </span>
            </div>
          </div>
        </section>

        {/* Conditional or Unified Workspace Views */}
        {activeSection === 'overview' && (
          <div className="space-y-6">
            <RFMVisualizations
              customers={customers}
              selectedSegment={selectedSegment}
              onSelectSegment={setSelectedSegment}
              onSelectCustomer={(cust: CustomerRFM) => {
                setSelectedCustomerId(cust.customerId);
              }}
            />

            <CustomerDirectory
              customers={customers}
              selectedSegment={selectedSegment}
              onSelectSegment={setSelectedSegment}
              selectedCustomer={selectedCustomer}
              onSelectCustomer={(cust) =>
                setSelectedCustomerId(cust ? cust.customerId : null)
              }
              thresholds={thresholds}
              onUpdateThresholds={setThresholds}
              onResetThresholds={() => setThresholds(DEFAULT_RFM_THRESHOLDS)}
              onRecordCustomerOrder={handleRecordCustomerOrder}
            />

            <MarketingPlaybooks
              customers={customers}
              selectedSegment={selectedSegment}
              onSelectSegment={setSelectedSegment}
              onExportSegmentCsv={(segId) => handleExportCsv(segId)}
            />

            <DataCleaningPanel
              cleaningConfig={cleaningConfig}
              onUpdateConfig={setCleaningConfig}
              pipelineResult={pipelineResult}
              onInjectAnomalySample={handleInjectAnomalySample}
            />
          </div>
        )}

        {activeSection === 'cleaning' && (
          <DataCleaningPanel
            cleaningConfig={cleaningConfig}
            onUpdateConfig={setCleaningConfig}
            pipelineResult={pipelineResult}
            onInjectAnomalySample={handleInjectAnomalySample}
          />
        )}

        {activeSection === 'customers' && (
          <CustomerDirectory
            customers={customers}
            selectedSegment={selectedSegment}
            onSelectSegment={setSelectedSegment}
            selectedCustomer={selectedCustomer}
            onSelectCustomer={(cust) =>
              setSelectedCustomerId(cust ? cust.customerId : null)
            }
            thresholds={thresholds}
            onUpdateThresholds={setThresholds}
            onResetThresholds={() => setThresholds(DEFAULT_RFM_THRESHOLDS)}
            onRecordCustomerOrder={handleRecordCustomerOrder}
          />
        )}

        {activeSection === 'playbooks' && (
          <MarketingPlaybooks
            customers={customers}
            selectedSegment={selectedSegment}
            onSelectSegment={setSelectedSegment}
            onExportSegmentCsv={(segId) => handleExportCsv(segId)}
          />
        )}
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white px-6 py-4">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            RFM Pulse — Customer Segmentation & Lifecycle Intelligence Workbench
          </div>
          <div className="flex items-center gap-3 font-mono-tabular">
            <span>Reference Date: 2026-10-08</span>
            <span aria-hidden="true">·</span>
            <span>Scoring Scale: 1–5 Quintiles (R, F, M)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
