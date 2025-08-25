export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

export const formatCurrency = (amount: number): string => {
  return `$${formatNumber(amount)}`;
};