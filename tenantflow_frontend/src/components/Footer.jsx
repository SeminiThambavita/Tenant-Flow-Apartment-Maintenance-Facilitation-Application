import Logo from './Logo';

export default function Footer() {
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

          <div>
            <p className="text-xs font-semibold text-slate-900">Quick Links</p>
            <ul className="mt-3 space-y-2 text-xs text-slate-600">
              <li><a className="hover:text-slate-900" href="/tenant-dashboard">Dashboard</a></li>
              <li><a className="hover:text-slate-900" href="/report-issue">Report Issue</a></li>
              <li><a className="hover:text-slate-900" href="/profile">Profile</a></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-900">Support</p>
            <ul className="mt-3 space-y-2 text-xs text-slate-600">
              <li>Emergency Line: 0112-XXX-XXX</li>
              <li>support@tenantflow.lk</li>
              <li>Mon to Sun, 24/7</li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-900">Legal</p>
            <ul className="mt-3 space-y-2 text-xs text-slate-600">
              <li>Terms of Service</li>
              <li>Privacy Policy</li>
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
