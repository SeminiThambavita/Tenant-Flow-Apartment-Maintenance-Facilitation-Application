export const ISSUE_STATUSES = {
  NEW: 'new',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in progress',
  COMPLETED: 'completed',
  DONE_PAYMENT_PENDING: 'done and payment pending',
  PAYMENT_DONE: 'payment done',
  PAYMENT_SUCCESSFUL: 'payment done',
};

export const normalizeStatus = (status) =>
  ({
    'payment successful': 'payment done',
  }[String(status || '').toLowerCase().trim().replace(/-/g, ' ')] ||
    String(status || '')
    .toLowerCase()
    .trim()
    .replace(/-/g, ' '));

export const formatStatusLabel = (status) => {
  const normalized = normalizeStatus(status);
  if (!normalized) return 'New';
  if (normalized === 'in progress') return 'In Progress';
  if (normalized === 'done and payment pending') return 'Done & Payment Pending';
  if (normalized === 'cost report submitted') return 'Cost Report Submitted';
  if (normalized === 'cost report rejected') return 'Cost Report Rejected';
  if (normalized === 'invoice issued') return 'Invoice Issued';
  if (normalized === 'payment pending') return 'Payment Pending';
  if (normalized === 'payment done') return 'Payment Done';
  if (normalized === 'task done') return 'Task Done';
  if (normalized === 'completed') return 'Completed';
  if (normalized === 'new') return 'New';
  if (normalized === 'assigned') return 'Assigned';
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
    key === 'payment done'
  );
};

export const getStatusBadgeTheme = (status, variant = 'pill') => {
  const key = normalizeStatus(status);
  const themes = {
    new: {
      pill: 'bg-blue-100 text-blue-800 border border-blue-300',
      circle: 'bg-blue-600 text-white border border-blue-700',
      short: 'NEW',
    },
    assigned: {
      pill: 'bg-blue-100 text-blue-800 border border-blue-300',
      circle: 'bg-blue-600 text-white border border-blue-700',
      short: 'ASSN',
    },
    'in progress': {
      pill: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
      circle: 'bg-emerald-600 text-white border border-emerald-700',
      short: 'PROG',
    },
    completed: {
      pill: 'bg-amber-100 text-amber-800 border border-amber-300',
      circle: 'bg-amber-500 text-white border border-amber-600',
      short: 'DONE',
    },
    'done and payment pending': {
      pill: 'bg-orange-100 text-orange-800 border border-orange-300',
      circle: 'bg-orange-500 text-white border border-orange-600',
      short: 'PEND',
    },
    'cost report submitted': {
      pill: 'bg-violet-100 text-violet-800 border border-violet-300',
      circle: 'bg-violet-600 text-white border border-violet-700',
      short: 'CRPT',
    },
    'cost report rejected': {
      pill: 'bg-rose-100 text-rose-800 border border-rose-300',
      circle: 'bg-rose-600 text-white border border-rose-700',
      short: 'REJ',
    },
    'invoice issued': {
      pill: 'bg-sky-100 text-sky-800 border border-sky-300',
      circle: 'bg-sky-600 text-white border border-sky-700',
      short: 'INV',
    },
    'payment pending': {
      pill: 'bg-amber-100 text-amber-800 border border-amber-300',
      circle: 'bg-amber-600 text-white border border-amber-700',
      short: 'DUE',
    },
    'payment done': {
      pill: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
      circle: 'bg-emerald-600 text-white border border-emerald-700',
      short: 'PD',
    },
    'task done': {
      pill: 'bg-teal-100 text-teal-800 border border-teal-300',
      circle: 'bg-teal-600 text-white border border-teal-700',
      short: 'TASK',
    },
  };

  const theme = themes[key] || {
    pill: 'bg-slate-100 text-slate-700 border border-slate-200',
    circle: 'bg-slate-500 text-white border border-slate-600',
    short: 'STAT',
  };

  return {
    className: theme[variant] || theme.pill,
    text: variant === 'circle' ? theme.short : formatStatusLabel(status),
  };
};
