import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import TenantPaymentsHistory from '../components/TenantPaymentsHistory';

export default function AdminTenantPayments() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const [profileName] = useState('Property Manager');

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/login', { state: { role: 'admin' } });
    }
  }, [navigate, role]);

  if (role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F3F4F8] text-[#1D1D2C] flex">
      <AdminSidebar active="tenant-payments" profileName={profileName} />

      <main className="flex-1 px-12 py-10">
        <div className="flex items-start gap-4 mb-7">
          <button onClick={() => navigate(-1)} className="mt-1 w-7 h-7 rounded-md border border-[#DCE0EE] text-[#596080] bg-white">←</button>
          <div>
            <h1 className="text-[35px] leading-9 font-semibold text-[#20253A]">Tenant Payments</h1>
            <p className="text-[13px] text-[#7681A8] mt-1">Payments completed by tenants for invoices sent from the dashboard</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#DDE2F0] p-5 shadow-sm">
          <TenantPaymentsHistory />
        </div>
      </main>
    </div>
  );
}