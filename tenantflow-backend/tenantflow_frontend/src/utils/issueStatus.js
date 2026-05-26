export const ISSUE_STATUSES = {
  NEW: 'new',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in progress',
  COMPLETED: 'completed',
  DONE_PAYMENT_PENDING: 'done and payment pending',
  PAYMENT_SUCCESSFUL: 'payment successful',
};

export const normalizeStatus = (status) =>
  String(status || '')
    .toLowerCase()
    .trim()
    .replace(/-/g, ' ');

export const formatStatusLabel = (status) => {
  const normalized = normalizeStatus(status);
  if (!normalized) return 'New';
  if (normalized === 'in progress') return 'In Progress';
  if (normalized === 'payment successful') return 'Payment Successful';
  if (normalized === 'done and payment pending') return 'Done & Payment Pending';
  if (normalized === 'completed') return 'Completed';
  if (normalized === 'new') return 'New';
  if (normalized === 'assigned') return 'New';
  return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`;
};

export const isOpenStatus = (status) => {
  const key = normalizeStatus(status);
  return key === 'new' || key === 'assigned' || key === 'in progress';
};

export const isCompletedStatus = (status) => {
  const key = normalizeStatus(status);
  return (
    key === 'completed' ||
    key === 'done and payment pending' ||
    key === 'payment successful'
  );
};
