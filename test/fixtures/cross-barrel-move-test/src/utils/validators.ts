export const validateEmail = (email: string): boolean => {
  return email.includes('@');
};

export const validatePhone = (phone: string): boolean => {
  return phone.length >= 10;
};