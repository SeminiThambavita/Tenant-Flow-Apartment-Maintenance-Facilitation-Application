import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildFileUrl } from '../utils/profileImage';

export default function ProfileDropdown({ userName = 'User', userInitials = 'U', profileImage = '' }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const avatarUrl = buildFileUrl(profileImage);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    navigate('/role-selection');
  };

  const handleProfileClick = () => {
    const role = localStorage.getItem('role');
    if (role === 'tenant') {
      navigate('/profile');
    } else if (role === 'admin') {
      navigate('/admin-profile');
    } else if (role === 'staff') {
      navigate('/staff-profile');
    }
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm hover:bg-blue-200 transition overflow-hidden border border-blue-100"
        title={userName}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={userName}
            className="w-full h-full object-cover"
          />
        ) : (
          userInitials
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500 mt-1">Logged in</p>
          </div>
          <button
            onClick={handleProfileClick}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            My Profile
          </button>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition border-t border-gray-100"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
