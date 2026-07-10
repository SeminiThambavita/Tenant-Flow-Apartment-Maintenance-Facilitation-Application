import Logo from './Logo';
import { Link } from 'react-router-dom';

const roleQuickLinks = {
  tenant: [
    { label: 'Dashboard', href: '/tenant-dashboard' },
    { label: 'Report Issue', href: '/report-issue' },
    { label: 'Profile', href: '/profile' }
  ],
  staff: [
    { label: 'Dashboard', href: '/staff-dashboard' },
    { label: 'Availability', href: '/staff/availability' },
    { label: 'Profile', href: '/staff/profile' }
  ],
  admin: [
    { label: 'Dashboard', href: '/admin-dashboard' },
    { label: 'Properties', href: '/admin/properties' },
    { label: 'Staff Assignments', href: '/admin/staff-assignments' },
    { label: 'Profile', href: '/admin/profile' }
  ]
};

export default function Footer({ hideQuickLinks = false, role = 'tenant' }) {
  const quickLinks = roleQuickLinks[role] || roleQuickLinks.tenant;

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo size={32} textClassName="text-sm font-semibold text-slate-900" />
            <p className="text-xs text-slate-500 mt-1">Apartment Maintenance</p>
            <p className="mt-3 text-xs text-slate-500">
              Streamlining maintenance requests, payments, and updates for tenants and property teams.
            </p>
          </div>

          {!hideQuickLinks && (
            <div>
              <p className="text-xs font-semibold text-slate-900">Quick Links</p>
              <ul className="mt-3 space-y-2 text-xs text-slate-600">
                {quickLinks.map((item) => (
                  <li key={item.href}><a className="hover:text-slate-900" href={item.href}>{item.label}</a></li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-slate-900">Support</p>
            <ul className="mt-3 space-y-2 text-xs text-slate-600">
              <li>Emergency Line: 0112-XXX-XXX</li>
              <li><a href="mailto:support@tenantflow.lk" className="hover:text-slate-900">support@tenantflow.lk</a></li>
              <li>Mon to Sun, 24/7</li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-900">Legal</p>
            <ul className="mt-3 space-y-2 text-xs text-slate-600">
              <li><Link className="hover:text-slate-900" to="/terms-of-service">Terms of Service</Link></li>
              <li><Link className="hover:text-slate-900" to="/privacy-policy">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>2026 Tenant Flow. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
