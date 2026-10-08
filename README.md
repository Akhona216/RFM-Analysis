I have created the RFM Pulse dashboard for real-time Customer Segmentation using RFM Analysis.
What Was Built
Transactional Data Cleaning & Preparation Pipeline: Live sanitization rules that detect and filter duplicate invoice numbers, unattributed null customer IDs, negative credit memos/chargebacks, malformed ERP timestamps, and extreme monetary outliers before computing RFM scores.
Real-Time RFM Engine & Quintile Calibration: Calculates Recency (days since last order), Frequency (validated order count), and Monetary (cumulative LTV and AOV) on a 1–5 quintile scale, with live sliders to adjust breakpoint thresholds and observe instant cohort re-segmentation.
Interactive Segment Visualizations:
5×5 Recency × Frequency Matrix Grid: Maps all 25 R×F score intersections to customer counts, revenue concentration, and segment definitions.
Recency × Monetary Behavioral Scatter Plot: Plots every customer by recency, cumulative spend, and order frequency with a 65-day lapse threshold marker.
Segment Revenue vs. Customer Share: Compares headcount percentage against lifetime revenue contribution across Champions, Loyal Customers, Potential Loyalists, New Customers, At Risk / Churn Risk, and Hibernating & Lost groups.
Targeted Marketing Recommendations & Playbooks: Provides behavioral pattern analysis, recommended interventions, channel strategies, ROI multiples, subject line templates, and cohort CSV exports for each segment.
