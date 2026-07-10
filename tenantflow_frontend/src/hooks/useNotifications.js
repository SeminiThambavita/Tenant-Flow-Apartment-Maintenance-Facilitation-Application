import { useState, useEffect, useCallback } from 'react';
import { notificationAPI } from '../api';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async (unreadOnly = false) => {
    try {
      setLoading(true);
      const response = await notificationAPI.getAll({ 
        limit: 50, 
        unreadOnly: unreadOnly ? 'true' : 'false' 
      });
      setNotifications(response.data.notifications || []);
      setError(null);
    } catch (err) {
      if (err.response?.status !== 401) {
        setError(err.message);
        console.error('Error fetching notifications:', err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      setUnreadCount(response.data.unreadCount || 0);
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error('Error fetching unread count:', err);
      }
    }
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
      await fetchUnreadCount();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, [fetchUnreadCount]);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationAPI.delete(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      await fetchUnreadCount();
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, [fetchUnreadCount]);

  const clearAllNotifications = useCallback(async () => {
    try {
      await notificationAPI.clearAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error clearing all notifications:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
  };
};
