import type { FullConfig } from '@playwright/test';

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL ?? 'http://localhost:8080';
  const url = `${baseURL}/Account/Login`;
  const timeoutMs = Number(process.env.HEALTH_TIMEOUT_MS ?? 30_000);
  const deadline = Date.now() + timeoutMs;
  let lastResult = 'no response';

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
      if (response.ok) return;
      lastResult = `HTTP ${response.status}`;
    } catch (error) {
      const cause = (error as { cause?: { code?: string } }).cause;
      lastResult = cause?.code ?? (error as Error).message;
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }

  throw new Error(
    `The app is not reachable at ${url} after ${timeoutMs / 1000}s (last result: ${lastResult}).\n` +
      'Start it from the repository root with:  docker compose up --build -d\n' +
      'Or point the tests at another address:   set the BASE_URL environment variable',
  );
}