const STORAGE_KEY = 'tenantflow_notifications';
const MAX_NOTIFICATIONS = 50;

const readNotifications = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeNotifications = (list) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};

export const getNotifications = () => readNotifications();

export const addNotification = ({ title, message, target, type, referenceId, createdAt }) => {
  const list = readNotifications();
  const hasDuplicate =
    type && referenceId
      ? list.some((item) => item.type === type && item.referenceId === referenceId)
      : false;

  if (hasDuplicate) {
    return list;
  }

  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const nextItem = {
    id,
    title: title || 'Notification',
    message: message || '',
    target: target || { path: '/tenant-dashboard' },
    type: type || 'info',
    referenceId: referenceId || null,
    createdAt: createdAt || new Date().toISOString(),
    read: false,
  };

  const nextList = [nextItem, ...list].slice(0, MAX_NOTIFICATIONS);
  writeNotifications(nextList);
  return nextList;
};

export const markNotificationRead = (id) => {
  const list = readNotifications();
  const nextList = list.map((item) =>
    item.id === id
      ? {
          ...item,
          read: true,
        }
      : item
  );
  writeNotifications(nextList);
  return nextList;
};
