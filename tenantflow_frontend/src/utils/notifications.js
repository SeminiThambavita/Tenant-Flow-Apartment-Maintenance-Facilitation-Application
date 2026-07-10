const STORAGE_KEY_PREFIX = 'tenantflow_notifications';
const MAX_NOTIFICATIONS = 50;

const resolveUserId = (userId) => userId || localStorage.getItem('userId') || 'anonymous';

const getStorageKey = (userId) => `${STORAGE_KEY_PREFIX}_${resolveUserId(userId)}`;

const readNotifications = (userId) => {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeNotifications = (list, userId) => {
  localStorage.setItem(getStorageKey(userId), JSON.stringify(list));
};

export const getNotifications = (userId) => readNotifications(userId);

export const addNotification = ({ title, message, target, type, referenceId, createdAt, userId }) => {
  const resolvedUserId = resolveUserId(userId);
  const list = readNotifications(resolvedUserId);
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
    userId: resolvedUserId,
    createdAt: createdAt || new Date().toISOString(),
    read: false,
  };

  const nextList = [nextItem, ...list].slice(0, MAX_NOTIFICATIONS);
  writeNotifications(nextList, resolvedUserId);
  return nextList;
};

export const markNotificationRead = (id, userId) => {
  const resolvedUserId = resolveUserId(userId);
  const list = readNotifications(resolvedUserId);
  const nextList = list.map((item) =>
    item.id === id
      ? {
          ...item,
          read: true,
        }
      : item
  );
  writeNotifications(nextList, resolvedUserId);
  return nextList;
};
