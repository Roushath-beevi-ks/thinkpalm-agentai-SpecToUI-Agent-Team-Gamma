/**
 * PRDs that ask for a distribution chart: employee metric (stress, salary, …) vs. how many employees.
 */
export type EmployeeMetricChartKind = "stress" | "salary";

export function parseEmployeeMetricChartIntent(prdText: string): EmployeeMetricChartKind | null {
  const t = prdText.toLowerCase();
  const hasStress = /stress|burnout|pressure|anxiety/.test(t);
  const hasSalary =
    /salary|salaries|\bwages?\b|compensation|remuneration|\bincome\b|pay\s*scale|paygrade|pay\s*band/.test(
      t
    );
  const hasEmployees =
    /employee|employees|headcount|staff|workforce|people|\bno\.?\s*:?\s*of\b|number\s+of|count\s+of/.test(
      t
    );
  const hasMetric = hasStress || hasSalary;
  const wantsChart =
    /chart|graph|bar\s*chart|line\s*chart|plot|visuali[sz]e|histogram|scatter/.test(t) ||
    (/relationship|relation\s*ship|\brelation\b|correlation|between|versus|\bvs\.?\b/.test(t) &&
      hasMetric);

  if (!hasEmployees || !hasMetric || !wantsChart) return null;

  if (hasStress && hasSalary) {
    const stressAt = t.search(/stress|burnout|pressure|anxiety/);
    const salaryAt = t.search(
      /salary|salaries|\bwages?\b|compensation|remuneration|\bincome\b|pay\s*scale|paygrade|pay\s*band/
    );
    if (stressAt >= 0 && salaryAt >= 0) return stressAt <= salaryAt ? "stress" : "salary";
  }
  if (hasSalary) return "salary";
  return "stress";
}

/** @deprecated Use parseEmployeeMetricChartIntent(prdText) === "stress" */
export function isStressEmployeeChartIntent(prdText: string): boolean {
  return parseEmployeeMetricChartIntent(prdText) === "stress";
}
