export const SRI_LANKAN_BANKS = [
  'Bank of Ceylon',
  'People\'s Bank',
  'Commercial Bank of Ceylon PLC',
  'Hatton National Bank PLC',
  'Sampath Bank PLC',
  'National Savings Bank',
  'Seylan Bank PLC',
  'DFCC Bank PLC',
  'Nations Trust Bank PLC',
  'Pan Asia Banking Corporation PLC',
  'Union Bank of Colombo PLC',
  'Amana Bank PLC',
  'Cargills Bank PLC',
  'Standard Chartered Bank',
  'HSBC Sri Lanka',
  'Citibank N.A.',
  'National Development Bank PLC',
  'Regional Development Bank',
  'State Bank of India',
  'Indian Bank',
  'Indian Overseas Bank',
  'MCB Bank Ltd',
  'Public Bank Berhad',
  'Habib Bank Ltd',
  'Deutsche Bank AG',
  'ICICI Bank Ltd',
];

export function filterSriLankanBanks(query) {
  const normalized = String(query || '').trim().toLowerCase();
  if (!normalized) return SRI_LANKAN_BANKS;
  return SRI_LANKAN_BANKS.filter((bank) => bank.toLowerCase().includes(normalized));
}
