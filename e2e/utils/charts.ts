import { expect, type Page } from '@playwright/test';

export interface ChartData {
  labels: string[];
  values: number[];
}

// Waits for the Chart.js chart on a canvas and returns its data,
// so tests check the numbers behind the chart, not its pixels.
export async function readChart(page: Page, canvasId: string): Promise<ChartData> {
  await expect
    .poll(
      () => page.evaluate((id: string) => Boolean((window as any).Chart?.getChart(id)), canvasId),
      { message: `Chart #${canvasId} should be drawn`, timeout: 15_000 },
    )
    .toBe(true);

  return page.evaluate((id: string) => {
    const chart = (window as any).Chart.getChart(id);
    return { labels: chart.data.labels as string[], values: chart.data.datasets[0].data as number[] };
  }, canvasId);
}
