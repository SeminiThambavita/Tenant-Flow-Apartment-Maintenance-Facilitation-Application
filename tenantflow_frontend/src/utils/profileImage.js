const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function buildFileUrl(pathValue) {
  if (!pathValue) return '';
  if (pathValue.startsWith('http://') || pathValue.startsWith('https://')) return pathValue;
  return `${API_BASE_URL}${pathValue}`;
}

export function getUserProfileImage(user) {
  return user?.profileImage || user?.staffProfilePhoto || '';
}