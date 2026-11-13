// Pulls the first number out of text like "20,000 kW", "84.8%" or "PR Ratio: 0.846".
export function parseNumber(text: string): number {
  const match = text.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  if (!match) throw new Error(`No number found in "${text}"`);
  return Number(match[0]);
}

export function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}