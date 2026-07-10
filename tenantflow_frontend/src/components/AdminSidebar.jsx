import { useCallback, useEffect, useRef, useState } from 'react';
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
  { key: 'staff-details', label: 'Staff Details', path: '/admin/staff-details', icon: '📋' },
  { key: 'profile', label: 'Profile', path: '/admin/profile', icon: '⚙' },
];

const MIN_WIDTH = 60;
const MAX_WIDTH = 320;
const DEFAULT_WIDTH = 180;

export default function AdminSidebar({ active = 'dashboard', profileName = 'Property Manager' }) {
  const navigate = useNavigate();
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem('adminSidebarWidth');
    return saved ? Number(saved) : DEFAULT_WIDTH;
  });
  const collapsed = width <= 80;
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(width);

  const onMouseMove = useCallback((e) => {
    if (!isDragging.current) return;
    const delta = e.clientX - startX.current;
    const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
    setWidth(newWidth);
  }, []);

  const onMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    localStorage.setItem('adminSidebarWidth', String(width));
  }, [width]);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const startDrag = (e) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  };

  // Persist after mouse up
  useEffect(() => {
    localStorage.setItem('adminSidebarWidth', String(width));
  }, [width]);

  return (
    <aside
      className="relative bg-white border-r border-[#E4E7F0] flex flex-col justify-between shrink-0 transition-none"
      style={{ width }}
    >
      <div className="overflow-hidden">
        <div className="px-3 py-4 border-b border-[#EEF0F6]">
          {collapsed ? (
            <div className="flex justify-center">
              <Logo size={22} textClassName="hidden" />
            </div>
          ) : (
            <>
              <Logo size={26} textClassName="text-[13px] font-semibold text-[#22263A] leading-4" />
              <p className="text-[10px] text-[#6B7390] leading-3 mt-1">Management Portal</p>
            </>
          )}
        </div>

        <nav className="px-2 py-3 space-y-0.5 text-[12px]">
          {navItems.map((item) => {
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(item.path)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-md transition ${
                  isActive ? 'bg-[#ECEEFF] text-[#3346F2] font-medium' : 'text-[#2A2E3F] hover:bg-[#F6F7FB]'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <span className="w-5 text-center shrink-0 text-[14px]">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      <button
        type="button"
        onClick={() => navigate('/admin/profile')}
        title={collapsed ? `${profileName} — Profile & settings` : undefined}
        className={`px-3 py-3 border-t border-[#EEF0F6] text-[11px] text-left hover:bg-[#F6F7FB] w-full flex items-center gap-2 ${collapsed ? 'justify-center' : 'justify-between'}`}
      >
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-semibold text-[#1F2233] truncate">{profileName}</p>
            <p className="text-[#7681A8]">Profile &amp; settings</p>
          </div>
        )}
        <div className="shrink-0">
          <NotificationBell />
        </div>
      </button>

      {/* Drag handle */}
      <div
        onMouseDown={startDrag}
        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-[#3346F2]/20 transition-colors group z-10"
        title="Drag to resize"
      >
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-[#D0D4E8] group-hover:bg-[#3346F2] transition-colors" />
      </div>
    </aside>
  );
}
