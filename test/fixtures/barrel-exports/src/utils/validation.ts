export const required = (value: string): boolean => {
  return value.trim().length > 0;
};

export const minLength = (value: string, min: number): boolean => {
  return value.length >= min;
};

export const isEmail = (value: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};
