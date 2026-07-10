import { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import { issueAPI, paymentAPI } from '../api';
import { formatStatusLabel, normalizeStatus } from '../utils/issueStatus';
import usePolling from '../hooks/usePolling';
import { broadcastStatusRefresh } from '../utils/statusRefresh';

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
};

const getLabel = (value) => {
  if (!value) return '—';
  if (typeof value === 'string') return value;
  return value.name || value.address || '—';
};

export default function TenantPaymentsHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [updatingTaskDone, setUpdatingTaskDone] = useState(false);
  const [closureUpdates, setClosureUpdates] = useState([]);
  const role = localStorage.getItem('role');

  useEffect(() => {
    const loadPayments = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await paymentAPI.getTenantPayments();
        setPayments(response.data?.payments || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load tenant payments');
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, []);

  usePolling(async () => {
    try {
      const response = await paymentAPI.getTenantPayments();
      setPayments(response.data?.payments || []);
    } catch {
      // keep current payments if refresh fails
    }
  }, 5000, role === 'admin');

  const paymentRows = useMemo(() => payments.map((payment) => {
    const invoice = payment.invoice || {};
    const issue = invoice.issue || {};
    const tenant = invoice.tenant || payment.tenant || {};
    const issueStatus = normalizeStatus(issue.status || issue.paymentStatus || invoice.paymentStatus || payment.status);

    return {
      ...payment,
      invoiceId: invoice._id || payment.invoice?._id || '—',
      invoiceNumber: invoice.invoiceNumber || payment.invoiceNumber || '—',
      taskId: payment.taskId || invoice.taskId || issue._id || '—',
      taskName: payment.taskName || invoice.taskName || issue.issueType || invoice.issueTitle || 'Maintenance',
      issueStatus,
      issueLabel: issue.specificSpot ? `${issue.issueType || 'Maintenance'} - ${issue.specificSpot}` : (issue.issueType || invoice.issueTitle || 'Maintenance'),
      tenantName: payment.tenantName || tenant.name || '—',
      tenantEmail: payment.tenantEmail || tenant.email || '—',
      tenantPhone: payment.tenantPhone || tenant.phone || '—',
      tenantUnit: payment.tenantUnit || tenant.unitNumber || tenant.apartmentNumber || invoice.location?.unitNumber || issue.unitNumber || '—',
      building: issue.building?.name || invoice.location?.building?.name || '—',
      unitNumber: invoice.location?.unitNumber || issue.unitNumber || issue.unit || tenant.unitNumber || tenant.apartmentNumber || '—',
      paymentDate: payment.createdAt || invoice.paidAt
    };
  }), [payments]);

  const visiblePayments = useMemo(
    () => paymentRows.filter((payment) => {
      const normalizedIssueStatus = normalizeStatus(payment.issueStatus || payment.status);
      const normalizedInvoiceStatus = normalizeStatus(payment.invoice?.paymentStatus || payment.invoice?.status);
      return (
        normalizedIssueStatus === 'payment done' ||
        normalizedIssueStatus === 'task done' ||
        normalizedInvoiceStatus === 'paid' ||
        normalizedInvoiceStatus === 'completed'
      );
    }),
    [paymentRows]
  );

  const openDetails = (payment) => {
    setSelectedPayment(payment);
    setShowReceipt(true);
  };

  const closeDetails = () => {
    setShowReceipt(false);
    setSelectedPayment(null);
  };

  const downloadReceipt = (payment) => {
    const invoice = payment.invoice || {};
    const issue = invoice.issue || {};
    const doc = new jsPDF();
    let y = 18;

    const write = (text, { bold = false, size = 11, extraGap = 0 } = {}) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(String(text ?? ''), 180);
      doc.text(lines, 14, y);
      y += (lines.length * 7) + extraGap;
    };

    write('TenantFlow Tenant Payment Receipt', { bold: true, size: 16, extraGap: 4 });
    write(`Receipt #: ${payment.orderId || payment.referenceNumber || payment._id}`, { bold: true });
    write(`Payment Date: ${formatDate(payment.createdAt)}`);
    write(`Payment Status: ${formatStatusLabel(payment.issueStatus || payment.status || 'payment done')}`);
    write(`Tenant: ${payment.tenantName || invoice.tenant?.name || '—'}`);
    write(`Tenant Email: ${payment.tenantEmail || invoice.tenant?.email || '—'}`);
    write(`Tenant Phone: ${payment.tenantPhone || invoice.tenant?.phone || '—'}`);
    write(`Invoice Number: ${payment.invoiceNumber || invoice.invoiceNumber || '—'}`);
    write(`Invoice ID: ${invoice._id || payment.invoiceId || '—'}`);
    write(`Task ID: ${payment.taskId || invoice.taskId || issue._id || '—'}`);
    write(`Task Name: ${payment.taskName || invoice.taskName || issue.issueType || '—'}`);
    write(`Location: ${payment.building || getLabel(issue.building) || '—'}, Unit ${payment.unitNumber || '—'}`);
    write(`Amount Paid: LKR ${Number(payment.amount || 0).toFixed(2)}`, { bold: true });
    write(`Payment Reference: ${payment.payherePaymentId || payment.transactionId || payment.orderId || '—'}`);

    doc.save(`tenant-payment-${payment.orderId || payment._id}.pdf`);
  };

  const markTaskDone = async () => {
    if (!selectedPayment?.invoice?.issue?._id || role !== 'admin') return;
    setUpdatingTaskDone(true);
    try {
      await issueAPI.update(selectedPayment.invoice.issue._id, { status: 'task done' });
      broadcastStatusRefresh();

      const updatedPayment = {
        ...selectedPayment,
        issueStatus: 'task done'
      };

      setSelectedPayment(updatedPayment);
      setPayments((prev) => prev.map((payment) => {
        if (payment._id !== selectedPayment._id) return payment;
        return {
          ...payment,
          invoice: {
            ...(payment.invoice || {}),
            issue: {
              ...((payment.invoice || {}).issue || {}),
              status: 'task done'
            }
          }
        };
      }));
      setClosureUpdates((prev) => [{
        id: `${selectedPayment._id}-${Date.now()}`,
        title: 'Task marked as done',
        message: `${selectedPayment.taskName} • Invoice ${selectedPayment.invoiceNumber} • Task ID ${selectedPayment.taskId}`,
        createdAt: new Date().toISOString()
      }, ...prev].slice(0, 5));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark task as done');
    } finally {
      setUpdatingTaskDone(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center"><p className="text-gray-600">Loading tenant payments...</p></div>;
  }

  if (showReceipt && selectedPayment) {
    const invoice = selectedPayment.invoice || {};
    const issue = invoice.issue || {};

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full p-8">
          <div className="mb-6">
            <div className="text-center mb-6 pb-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Tenant Payment Receipt</h2>
              <p className="text-gray-600 mt-1">Receipt #{selectedPayment.orderId || selectedPayment.referenceNumber || selectedPayment._id}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div><p className="text-xs text-gray-600 font-semibold">Tenant Name</p><p className="text-gray-800 font-medium break-all">{selectedPayment.tenantName}</p></div>
              <div><p className="text-xs text-gray-600 font-semibold">Tenant Email</p><p className="text-gray-800 font-medium break-all">{selectedPayment.tenantEmail}</p></div>
              <div><p className="text-xs text-gray-600 font-semibold">Tenant Phone</p><p className="text-gray-800 font-medium break-all">{selectedPayment.tenantPhone}</p></div>
              <div><p className="text-xs text-gray-600 font-semibold">Tenant Unit</p><p className="text-gray-800 font-medium break-all">{selectedPayment.tenantUnit}</p></div>
              <div><p className="text-xs text-gray-600 font-semibold">Invoice Number</p><p className="text-gray-800 font-medium break-all">{selectedPayment.invoiceNumber}</p></div>
              <div><p className="text-xs text-gray-600 font-semibold">Invoice ID</p><p className="text-gray-800 font-medium break-all">{selectedPayment.invoiceId}</p></div>
              <div><p className="text-xs text-gray-600 font-semibold">Task ID</p><p className="text-gray-800 font-medium break-all">{selectedPayment.taskId}</p></div>
              <div><p className="text-xs text-gray-600 font-semibold">Task Name</p><p className="text-gray-800 font-medium break-all">{selectedPayment.taskName}</p></div>
              <div><p className="text-xs text-gray-600 font-semibold">Issue Type</p><p className="text-gray-800 font-medium break-all">{selectedPayment.issueLabel}</p></div>
              <div><p className="text-xs text-gray-600 font-semibold">Location</p><p className="text-gray-800 font-medium break-all">{`${selectedPayment.building || getLabel(issue.building) || '—'}, Unit ${selectedPayment.unitNumber || '—'}`}</p></div>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-700 font-medium">Amount Paid</span>
                <span className="text-3xl font-bold text-green-600">LKR {Number(selectedPayment.amount || 0).toFixed(2)}</span>
              </div>
              <div className="text-sm text-gray-600">Status: {formatStatusLabel(selectedPayment.issueStatus || selectedPayment.status)}</div>
            </div>

            {(selectedPayment.payherePaymentId || selectedPayment.transactionId || selectedPayment.orderId) && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-600 font-semibold mb-1">Payment Reference</p>
                <p className="text-blue-800 font-mono text-sm">{selectedPayment.payherePaymentId || selectedPayment.transactionId || selectedPayment.orderId}</p>
              </div>
            )}

            {role === 'admin' && selectedPayment.invoice?.issue?._id && normalizeStatus(selectedPayment.issueStatus || selectedPayment.status) !== 'task done' && (
              <div className="mb-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-emerald-900">Task Closure</p>
                  <p className="text-xs text-emerald-700 mt-1">Mark this task as done after confirming the tenant payment.</p>
                </div>
                <button
                  onClick={markTaskDone}
                  disabled={updatingTaskDone}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-70"
                >
                  {updatingTaskDone ? 'Updating...' : 'Mark Task Done'}
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => downloadReceipt(selectedPayment)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              📥 Download Receipt
            </button>
            <button
              onClick={closeDetails}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Tenant Payments</h2>
        <p className="text-gray-600 mt-1">Payments completed by tenants for invoices sent</p>
      </div>

      {closureUpdates.length > 0 && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <p className="text-sm font-semibold text-emerald-900">Task closure update</p>
              <p className="text-xs text-emerald-700">The latest payment-linked task was marked as done.</p>
            </div>
          </div>
          <div className="space-y-2">
            {closureUpdates.map((item) => (
              <div key={item.id} className="rounded-md bg-white border border-emerald-200 px-3 py-2">
                <p className="text-sm font-semibold text-emerald-900">{item.title}</p>
                <p className="text-xs text-emerald-700 mt-0.5">{item.message}</p>
                <p className="text-[11px] text-emerald-500 mt-1">{formatDate(item.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {visiblePayments.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 text-lg">No tenant payments yet</p>
          <p className="text-gray-400 text-sm mt-2">Paid invoices will appear here once tenants complete payment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {visiblePayments.map((payment) => (
            <div key={payment._id} className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-gray-800">{payment.tenantName} - {payment.taskName}</h3>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">✓ {formatStatusLabel(payment.issueStatus || payment.status || 'payment done')}</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div><p className="text-xs text-gray-600">Tenant</p><p className="font-medium text-gray-800">{payment.tenantName}</p></div>
                    <div><p className="text-xs text-gray-600">Invoice Number</p><p className="font-medium text-gray-800">{payment.invoiceNumber}</p></div>
                    <div><p className="text-xs text-gray-600">Payment Date</p><p className="font-medium text-gray-800">{formatDate(payment.paymentDate)}</p></div>
                    <div><p className="text-xs text-gray-600">Amount Paid</p><p className="font-bold text-green-600">LKR {Number(payment.amount || 0).toFixed(2)}</p></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div><p className="text-xs text-gray-600">Invoice ID</p><p className="font-mono text-gray-800 text-sm">{payment.invoiceId}</p></div>
                    <div><p className="text-xs text-gray-600">Task ID</p><p className="font-mono text-gray-800 text-sm">{payment.taskId}</p></div>
                    <div><p className="text-xs text-gray-600">Location</p><p className="font-medium text-gray-800">{payment.building}, Unit {payment.unitNumber}</p></div>
                  </div>

                  <p className="text-xs text-gray-600">Contact: {payment.tenantEmail} • {payment.tenantPhone}</p>
                </div>

                <button
                  onClick={() => openDetails(payment)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition whitespace-nowrap"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}