export const STATUS_REFRESH_EVENT = 'tenantflow:status-refresh';
export const STATUS_REFRESH_KEY = 'tenantflow:status-refresh-ts';

export const broadcastStatusRefresh = () => {
  const timestamp = String(Date.now());

  try {
    window.dispatchEvent(new CustomEvent(STATUS_REFRESH_EVENT));
    localStorage.setItem(STATUS_REFRESH_KEY, timestamp);
    localStorage.removeItem(STATUS_REFRESH_KEY);
  } catch {
    // ignore broadcast failures outside the browser
  }
};