import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import NotificationBell from './NotificationBell';

const navItems = [
  { key: 'dashboard', label: 'Dashboard', path: '/admin-dashboard', icon: '◫' },
  { key: 'properties', label: 'Properties', path: '/admin/properties', icon: '▣' },
  { key: 'staff', label: 'Task Assignment', path: '/admin/staff-assignments', icon: '⌂' },
  { key: 'repairs', label: 'Tasks List', path: '/admin/in-progress-repairs', icon: '⚒' },
  { key: 'tenant-payments', label: 'Tenant Payments', path: '/admin/tenant-payments', icon: '₨' },
  { key: 'cost-reports', label: 'Cost Report Approvals', path: '/admin-dashboard#cost-report-approvals', icon: '✓' },
  { key: 'staff-approvals', label: 'Staff Approvals', path: '/admin-dashboard#staff-approvals', icon: '👥' },
  { key: 'profile', label: 'Profile', path: '/admin/profile', icon: '⚙' },
];

export default function AdminSidebar({ active = 'dashboard', profileName = 'Property Manager' }) {
  const navigate = useNavigate();

  return (
    <aside className="w-[180px] bg-white border-r border-[#E4E7F0] flex flex-col justify-between shrink-0">
      <div>
        <div className="px-4 py-5 border-b border-[#EEF0F6]">
          <Logo size={28} textClassName="text-[14px] font-semibold text-[#22263A] leading-4" />
          <p className="text-[10px] text-[#6B7390] leading-3 mt-1">Management Portal</p>
        </div>

        <nav className="px-3 py-4 space-y-1 text-[12px]">
          {navItems.map((item) => {
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md ${
                  isActive
                    ? 'bg-[#ECEEFF] text-[#3346F2] font-medium'
                    : 'text-[#2A2E3F] hover:bg-[#F6F7FB]'
                }`}
              >
                <span className="w-5 text-center shrink-0">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <button
        type="button"
        onClick={() => navigate('/admin/profile')}
        className="px-4 py-4 border-t border-[#EEF0F6] text-[11px] text-left hover:bg-[#F6F7FB] w-full flex items-center justify-between gap-2"
      >
        <div>
          <p className="font-semibold text-[#1F2233] truncate">{profileName}</p>
          <p className="text-[#7681A8]">Profile &amp; settings</p>
        </div>
        <div className="shrink-0">
          <NotificationBell />
        </div>
      </button>
    </aside>
  );
}
