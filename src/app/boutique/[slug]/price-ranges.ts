export const PRICE_RANGES = [
  { label: "Moins de 30 €", value: "lt30",   test: (p: number) => p < 30 },
  { label: "30 € – 60 €",   value: "30-60",  test: (p: number) => p >= 30 && p <= 60 },
  { label: "60 € – 100 €",  value: "60-100", test: (p: number) => p > 60 && p <= 100 },
  { label: "Plus de 100 €", value: "gt100",  test: (p: number) => p > 100 },
];

export function filterByPrice(price: number, range: string | undefined): boolean {
  if (!range) return true;
  const r = PRICE_RANGES.find((r) => r.value === range);
  return r ? r.test(price) : true;
}
