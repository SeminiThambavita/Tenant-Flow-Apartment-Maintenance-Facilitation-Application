import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import ProfileDropdown from './ProfileDropdown';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', path: '/staff-dashboard' },
  { key: 'availability', label: 'Availability', path: '/staff/availability' },
  { key: 'profile', label: 'Profile', path: '/staff/profile' },
];

export function getInitials(name) {
  if (!name) return 'ST';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export default function StaffNav({
  active = 'dashboard',
  profileName = 'Staff Member',
  showBack = false,
  backLabel = 'Back',
  backPath = '/staff-dashboard',
}) {
  const navigate = useNavigate();

  return (
    <header className="h-14 bg-white border-b border-[#E5E7EF] flex items-center justify-between px-4 md:px-6 sticky top-0 z-50">
      <div className="flex items-center gap-3 min-w-0">
        {showBack && (
          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="shrink-0 text-xs font-semibold text-[#3F46F0] hover:text-[#2f36c8]"
          >
            {backLabel}
          </button>
        )}
        <Logo size={28} textClassName="text-lg font-semibold text-[#171A2A]" />
      </div>

      <nav className="flex items-center gap-4 md:gap-6 text-sm">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => !isActive && navigate(item.path)}
              className={
                isActive
                  ? 'font-semibold text-[#3F46F0]'
                  : 'font-medium text-[#2A2E3F] hover:text-[#3F46F0]'
              }
            >
              {item.label}
            </button>
          );
        })}
        <ProfileDropdown userName={profileName} userInitials={getInitials(profileName)} />
      </nav>
    </header>
  );
}
