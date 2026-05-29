import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffNav from '../components/StaffNav';
import StaffPaymentsHistory from '../components/StaffPaymentsHistory';

export default function StaffTenantPayments() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const [profileName] = useState('Staff Member');

  useEffect(() => {
    if (role !== 'staff') {
      navigate('/login', { state: { role: 'staff' } });
    }
  }, [navigate, role]);

  if (role !== 'staff') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F4F5F9] text-[#171A2A] flex flex-col">
      <StaffNav active="tenant-payments" profileName={profileName} showBack backPath="/staff-dashboard" />

      <main className="max-w-6xl mx-auto w-full pt-8 px-4 pb-12">
        <div className="mb-8 flex items-start gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition flex items-center justify-center"
          >
            ←
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Tenant Payments</h1>
            <p className="text-gray-600 mt-1">Payments made by tenants for tasks assigned to you</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <StaffPaymentsHistory />
        </div>
      </main>
    </div>
  );
}