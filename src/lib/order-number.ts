export function formatOrderNumber(orderNumber: number, createdAt: string | Date) {
  const year = new Date(createdAt).getFullYear();
  return `CMD-${year}-${String(orderNumber).padStart(4, "0")}`;
}
