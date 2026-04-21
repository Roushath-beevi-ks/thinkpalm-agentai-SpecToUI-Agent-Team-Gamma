/**
 * PRDs for analytics / BI SaaS dashboards (InsightBoard-style: sidebar, KPIs, charts).
 * Checked before generic task-management preview so dashboard PRDs get the rich chart layout.
 */
export function isAnalyticsDashboardSaaSIntent(prdText: string): boolean {
  const t = prdText.toLowerCase();
  if (/insightboard/.test(t)) return true;

  const dashboardProduct =
    /analytics\s+dashboard|dashboard\s+saas|business\s+analytics|data\s+visuali[sz]|metrics?\s+and\s+reports|\bbi\s+dashboard/.test(
      t
    );
  const hasCharts =
    /line\s*chart|bar\s*chart|pie\s*chart|donut\s*chart|\bchart\b.*\bmetric|kpi\s*card/.test(t) ||
    (/chart/.test(t) && /metric|kpi|revenue|growth/.test(t));
  const hasNav =
    (/sidebar/.test(t) && /dashboard/.test(t) && (/report/.test(t) || /setting/.test(t))) ||
    /navigation.*dashboard.*report/i.test(prdText);

  if (dashboardProduct && hasCharts) return true;
  if (dashboardProduct && hasNav) return true;
  if (/visualize\s+business\s+data|saas.*dashboard|dashboard\s+platform/.test(t) && hasCharts)
    return true;

  return false;
}
