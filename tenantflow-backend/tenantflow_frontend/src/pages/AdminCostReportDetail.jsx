import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { costReportAPI, invoiceAPI } from '../api';
import AdminSidebar from '../components/AdminSidebar';
import CostReportApproval from '../components/CostReportApproval';

export default function AdminCostReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const [costReport, setCostReport] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invoiceActionLoading, setInvoiceActionLoading] = useState(false);
  const [invoiceActionMessage, setInvoiceActionMessage] = useState('');

  const loadReport = useCallback(async () => {
    if (!id || role !== 'admin') return;
    try {
      const response = await costReportAPI.getById(id);
      const report = response?.data?.costReport || null;
      setCostReport(report);
      setInvoice(report?.invoice || null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load cost report.');
      setCostReport(null);
      setInvoice(null);
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

  const handleApprovalComplete = (_action, createdInvoice) => {
    if (createdInvoice) {
      setInvoice(createdInvoice);
      setInvoiceActionMessage('Invoice created as a draft. Review it below, then send it to the tenant.');
      loadReport();
      return;
    }

    navigate('/admin-dashboard');
  };

  const handleSendInvoice = async () => {
    if (!invoice?._id) return;

    setInvoiceActionLoading(true);
    setInvoiceActionMessage('');
    try {
      const response = await invoiceAPI.sendToTenant(invoice._id);
      const sentInvoice = response?.data?.invoice || null;
      if (sentInvoice) {
        setInvoice(sentInvoice);
      }
      setInvoiceActionMessage('Invoice sent to the tenant and notification delivered.');
      await loadReport();
    } catch (err) {
      setInvoiceActionMessage(err.response?.data?.message || 'Failed to send invoice to tenant.');
    } finally {
      setInvoiceActionLoading(false);
    }
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
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-[#DDE2F0] shadow-sm overflow-hidden">
                <CostReportApproval
                  costReport={costReport}
                  issue={costReport.issue}
                  onApprovalComplete={handleApprovalComplete}
                  onClose={() => navigate('/admin-dashboard')}
                />
              </div>

              {invoice && (
                <div className="bg-white rounded-xl border border-[#DDE2F0] shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-[#7681A8] font-semibold">Generated Invoice</p>
                      <h2 className="text-xl font-semibold text-[#20253A] mt-1">{invoice.invoiceNumber || 'Invoice draft'}</h2>
                      <p className="text-sm text-[#7681A8] mt-1">{invoice.issueTitle || costReport.issue?.issueType || 'Maintenance'}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${String(invoice.status || '').toLowerCase() === 'draft' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                      {String(invoice.status || '').toLowerCase() === 'draft' ? 'Draft' : 'Sent to tenant'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-sm">
                    <div className="rounded-lg bg-[#F7F8FC] p-3">
                      <p className="text-[11px] uppercase tracking-wide text-[#7681A8] font-semibold">Total</p>
                      <p className="text-lg font-semibold text-[#20253A]">LKR {Number(invoice.total || 0).toFixed(2)}</p>
                    </div>
                    <div className="rounded-lg bg-[#F7F8FC] p-3">
                      <p className="text-[11px] uppercase tracking-wide text-[#7681A8] font-semibold">Issued</p>
                      <p className="text-sm font-semibold text-[#20253A]">{invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleString() : '—'}</p>
                    </div>
                    <div className="rounded-lg bg-[#F7F8FC] p-3">
                      <p className="text-[11px] uppercase tracking-wide text-[#7681A8] font-semibold">Tenant View</p>
                      <p className="text-sm font-semibold text-[#20253A]">{String(invoice.status || '').toLowerCase() === 'draft' ? 'Hidden until sent' : 'Available in My Invoices'}</p>
                    </div>
                  </div>

                  {invoiceActionMessage && (
                    <div className="mt-4 rounded-lg border border-[#DDE2F0] bg-[#F7F8FC] px-4 py-3 text-sm text-[#37415D]">
                      {invoiceActionMessage}
                    </div>
                  )}

                  <div className="mt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => navigate('/admin-dashboard')}
                      className="px-4 py-2 rounded-lg border border-[#D7DBE8] bg-white text-sm font-semibold text-[#37415D]"
                    >
                      Back to Dashboard
                    </button>
                    {String(invoice.status || '').toLowerCase() === 'draft' && (
                      <button
                        type="button"
                        onClick={handleSendInvoice}
                        disabled={invoiceActionLoading}
                        className="px-4 py-2 rounded-lg bg-[#3346F2] text-white text-sm font-semibold disabled:opacity-60"
                      >
                        {invoiceActionLoading ? 'Sending...' : 'Send to Tenant'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}