import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { costReportAPI } from '../api';
import AdminSidebar from '../components/AdminSidebar';
import CostReportApproval from '../components/CostReportApproval';

export default function AdminCostReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const [costReport, setCostReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReport = useCallback(async () => {
    if (!id || role !== 'admin') return;
    try {
      const response = await costReportAPI.getById(id);
      setCostReport(response?.data?.costReport || null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load cost report.');
      setCostReport(null);
    } finally {
      setLoading(false);
    }
  }, [id, role]);

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/login', { state: { role: 'admin' } });
      return;
    }
    loadReport();
  }, [role, navigate, loadReport]);

  const handleApprovalComplete = () => {
    navigate('/admin-dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F3F4F8] text-[#1D1D2C] flex">
      <AdminSidebar active="dashboard" profileName="Property Manager" />
      <main className="flex-1 px-5 py-5">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => navigate('/admin-dashboard')}
              className="w-8 h-8 rounded-md border border-[#DCE0EE] text-[#596080] bg-white"
              aria-label="Back to dashboard"
            >
              ←
            </button>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#7681A8] font-semibold">Cost Report Review</p>
              <h1 className="text-[28px] leading-tight font-semibold text-[#20253A]">Approve or Reject</h1>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl border border-[#DDE2F0] p-5 text-[12px] text-[#7079A3]">Loading cost report...</div>
          ) : error && !costReport ? (
            <div className="bg-white rounded-xl border border-red-200 p-5 text-sm text-red-700">{error}</div>
          ) : costReport ? (
            <div className="bg-white rounded-xl border border-[#DDE2F0] shadow-sm overflow-hidden">
              <CostReportApproval
                costReport={costReport}
                issue={costReport.issue}
                onApprovalComplete={handleApprovalComplete}
                onClose={() => navigate('/admin-dashboard')}
              />
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}