import { describe, expect, it } from "vitest";
import { parseEmployeeMetricChartIntent } from "@/lib/chart-intent";
import { isAnalyticsDashboardSaaSIntent } from "@/lib/analytics-dashboard-intent";

describe("chart-intent", () => {
  it("detects salary vs employees bar chart intent", () => {
    const prd = `Employees by salary band — show a bar chart of headcount per band.`;
    expect(parseEmployeeMetricChartIntent(prd)).toBe("salary");
  });

  it("returns null when chart intent is not employee metrics", () => {
    expect(parseEmployeeMetricChartIntent("Build a login page with a button.")).toBeNull();
  });
});

describe("analytics-dashboard-intent", () => {
  it("detects InsightBoard-style analytics PRDs", () => {
    expect(
      isAnalyticsDashboardSaaSIntent(
        "Product Name: InsightBoard. Analytics dashboard with KPI cards and line chart."
      )
    ).toBe(true);
  });
});
