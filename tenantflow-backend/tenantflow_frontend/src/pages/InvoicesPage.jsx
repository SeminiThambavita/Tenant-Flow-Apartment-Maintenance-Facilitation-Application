import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffNav from '../components/StaffNav';
import InvoicesList from '../components/InvoicesList';

export default function InvoicesPage() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const [profileName] = useState('Tenant');

  if (role !== 'tenant') {
    navigate('/login', { state: { role: 'tenant' } });
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F4F5F9] text-[#171A2A]">
      <StaffNav active="invoices" profileName={profileName} showBack backPath="/tenant-dashboard" />

      <main className="max-w-6xl mx-auto pt-8 px-4 pb-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <button 
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition flex items-center justify-center"
            >
              ←
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">My Invoices</h1>
              <p className="text-gray-600 mt-1">View and pay your maintenance invoices</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <InvoicesList />
        </div>
      </main>
    </div>
  );
}
