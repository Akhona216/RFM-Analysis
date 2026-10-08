import React, { useState } from 'react';
import {
  CustomerRFM,
  SEGMENT_DEFINITIONS,
  SegmentId,
} from '../data/rfmEngine';

interface MarketingPlaybooksProps {
  customers: CustomerRFM[];
  selectedSegment: SegmentId | 'all';
  onSelectSegment: (segment: SegmentId | 'all') => void;
  onExportSegmentCsv: (segment: SegmentId) => void;
}

export const MarketingPlaybooks: React.FC<MarketingPlaybooksProps> = ({
  customers,
  selectedSegment,
  onSelectSegment,
  onExportSegmentCsv,
}) => {
  const [launchedCampaigns, setLaunchedCampaigns] = useState<Record<string, string>>({});

  const segmentOrder: SegmentId[] = [
    'champions',
    'loyal',
    'potential_loyalist',
    'new_customers',
    'churn_risk',
    'hibernating',
  ];

  const visibleSegments =
    selectedSegment === 'all'
      ? segmentOrder
      : segmentOrder.filter((s) => s === selectedSegment);

  const handleTriggerCampaign = (segId: SegmentId, count: number) => {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setLaunchedCampaigns((prev) => ({
      ...prev,
      [segId]: `Dispatched to ${count} recipients at ${timestamp}`,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Behavioral Pattern Analysis & Targeted Marketing Playbooks
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Actionable lifecycle interventions mapped to each RFM cohort’s purchase cadence, basket size, and defection risk
          </p>
        </div>

        {/* Segment Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-md">
          <button
            type="button"
            onClick={() => onSelectSegment('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              selectedSegment === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Playbooks (6)
          </button>
          {segmentOrder.map((segId) => {
            const meta = SEGMENT_DEFINITIONS[segId];
            return (
              <button
                key={segId}
                type="button"
                onClick={() => onSelectSegment(segId)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                  selectedSegment === segId
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {meta.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Playbook Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {visibleSegments.map((segId, idx) => {
          const meta = SEGMENT_DEFINITIONS[segId];
          const group = customers.filter((c) => c.segment === segId);
          const cohortRevenue = group.reduce((s, c) => s + c.monetary, 0);
          const avgRecency =
            group.length > 0
              ? Math.round(group.reduce((s, c) => s + c.recencyDays, 0) / group.length)
              : 0;
          const avgAov =
            group.length > 0
              ? Math.round(group.reduce((s, c) => s + c.avgOrderValue, 0) / group.length)
              : 0;
          const dispatchStatus = launchedCampaigns[segId];

          return (
            <div
              key={segId}
              className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between"
            >
              <div>
                {/* Top Kicker + Title */}
                <div className="flex items-baseline justify-between gap-2 pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-xs shrink-0"
                      style={{ backgroundColor: meta.accentColor }}
                    />
                    <h3 className="text-base font-semibold text-slate-900">
                      0{idx + 1}. {meta.name}
                    </h3>
                  </div>
                  <div className="text-xs text-slate-500 font-mono-tabular">
                    <span>{group.length} customers</span>
                    <span aria-hidden="true"> · </span>
                    <span className="font-semibold text-slate-900">
                      ${cohortRevenue.toLocaleString()} LTV
                    </span>
                  </div>
                </div>

                {/* Unboxed Metadata Summary */}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono-tabular">
                  <span>Retention Risk: {meta.retentionRisk}</span>
                  <span aria-hidden="true">·</span>
                  <span>Mean Recency: {avgRecency}d</span>
                  <span aria-hidden="true">·</span>
                  <span>Mean AOV: ${avgAov}</span>
                  <span aria-hidden="true">·</span>
                  <span>Est. ROI: {meta.marketingPlaybook.estimatedRoiMultiple}</span>
                </div>

                {/* Behavioral Pattern Analysis */}
                <div className="mt-4 space-y-2.5 text-sm">
                  <div>
                    <div className="text-xs font-semibold text-slate-700">
                      Observed Behavioral Pattern
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {meta.behaviorPattern}
                    </p>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-slate-700">
                      Recommended Marketing Intervention
                    </div>
                    <p className="text-xs text-slate-900 font-medium mt-0.5">
                      {meta.marketingPlaybook.recommendedAction}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Channel: {meta.marketingPlaybook.primaryChannel} · Incentive:{' '}
                      {meta.marketingPlaybook.offerStructure}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-xs text-slate-500">
                      Recommended Subject Line / Hook:
                    </div>
                    <div className="text-xs font-mono text-slate-800 mt-0.5">
                      "{meta.marketingPlaybook.subjectLineTemplate}"
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-teal-800 font-medium">
                  {dispatchStatus ? (
                    <span>{dispatchStatus}</span>
                  ) : (
                    <span className="text-slate-500">
                      Target Impact: {meta.marketingPlaybook.expectedLift}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onExportSegmentCsv(segId)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors whitespace-nowrap"
                  >
                    Export Cohort CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTriggerCampaign(segId, group.length)}
                    className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors whitespace-nowrap"
                  >
                    {dispatchStatus ? 'Re-Sync Campaign' : 'Stage Playbook'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
