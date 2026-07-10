import { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import { paymentAPI } from '../api';
import usePolling from '../hooks/usePolling';
import { formatStatusLabel, normalizeStatus } from '../utils/issueStatus';

export default function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const getBuildingLabel = (value) => {
    if (!value) return '—';
    if (typeof value === 'string') return value;
    return value.name || value.address || '—';
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await paymentAPI.getAll();
      setPayments(response.data?.payments || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payment history');
      console.error('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  };

  usePolling(loadPayments, 5000, true);

  const openDetails = (payment) => {
    setSelectedPayment(payment);
    setShowReceipt(true);
  };

  const closeDetails = () => {
    setShowReceipt(false);
    setSelectedPayment(null);
  };

  const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString();
  };

  const paymentRows = useMemo(() => payments.map((payment) => {
    const invoice = payment.invoice || {};
    const issue = invoice.issue || {};
    const taskId = payment.taskId || invoice.taskId || issue._id || invoice.issue || payment.invoice?._id || '—';
    const taskName = payment.taskName || invoice.taskName || issue.issueType || invoice.issueTitle || 'Maintenance';
    const invoiceId = invoice._id || payment.invoice?._id || '—';
    const issueStatus = normalizeStatus(issue.status || issue.paymentStatus || invoice.paymentStatus || payment.status);

    return {
      ...payment,
      invoiceId,
      taskId,
      taskName,
      issueStatus,
      invoiceNumber: invoice.invoiceNumber || payment.invoiceNumber || '—',
      issueType: issue.issueType || invoice.issueTitle || 'Maintenance',
      issueLabel: issue.specificSpot ? `${issue.issueType || 'Maintenance'} - ${issue.specificSpot}` : (issue.issueType || invoice.issueTitle || 'Maintenance'),
      building: issue.building?.name || invoice.location?.building?.name || '—',
      unitNumber: invoice.location?.unitNumber || issue.unitNumber || issue.unit || '—',
      paymentDate: payment.createdAt || invoice.paidAt
    };
  }), [payments]);

  const visiblePayments = useMemo(
    () => paymentRows.filter((payment) => {
      const normalizedIssueStatus = normalizeStatus(payment.issueStatus || payment.status);
      const normalizedInvoiceStatus = normalizeStatus(payment.invoice?.paymentStatus || payment.invoice?.status);
      return normalizedIssueStatus === 'payment done' || normalizedInvoiceStatus === 'payment done' || normalizedInvoiceStatus === 'paid';
    }),
    [paymentRows]
  );

  const renderDetailField = (label, value) => (
    <div>
      <p className="text-xs text-gray-600 font-semibold">{label}</p>
      <p className="text-gray-800 font-medium break-all">{value || '—'}</p>
    </div>
  );

  const downloadReceipt = (payment) => {
    const invoice = payment.invoice || {};
    const issue = invoice.issue || {};
    const receiptNumber = payment.orderId || payment.referenceNumber || payment._id;
    const doc = new jsPDF();
    let y = 18;

    const write = (text, { bold = false, size = 11, extraGap = 0 } = {}) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(String(text ?? ''), 180);
      doc.text(lines, 14, y);
      y += (lines.length * 7) + extraGap;
    };

    write('TenantFlow Payment Receipt', { bold: true, size: 16, extraGap: 4 });
    write(`Receipt #: ${receiptNumber}`, { bold: true });
    write(`Payment Date: ${formatDate(payment.createdAt)}`);
    write(`Payment Status: ${formatStatusLabel(payment.status || 'payment done')}`);
    write(`Invoice Number: ${payment.invoiceNumber || invoice.invoiceNumber || '—'}`);
    write(`Invoice ID: ${invoice._id || payment.invoiceId || '—'}`);
    write(`Task ID: ${payment.taskId || invoice.taskId || issue._id || '—'}`);
    write(`Task Name: ${payment.taskName || invoice.taskName || issue.issueType || '—'}`);
    write(`Issue Type: ${payment.issueType || issue.issueType || '—'}`);
    write(`Location: ${payment.building || getBuildingLabel(issue.building) || '—'}, Unit ${payment.unitNumber || '—'}`);
    write(`Amount Paid: LKR ${Number(payment.amount || 0).toFixed(2)}`, { bold: true });
    write(`Payment Reference: ${payment.payherePaymentId || payment.transactionId || payment.orderId || '—'}`);
    if (payment.description || invoice.issueTitle || payment.taskName) {
      write(`Description: ${payment.description || invoice.issueTitle || payment.taskName}`);
    }

    doc.save(`receipt-${receiptNumber}.pdf`);
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Loading payment history...</p>
      </div>
    );
  }

  if (showReceipt && selectedPayment) {
    const invoice = selectedPayment.invoice || {};
    const issue = invoice.issue || {};
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full p-8">
          {/* Receipt */}
          <div className="mb-6">
            <div className="text-center mb-6 pb-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Payment Receipt</h2>
              <p className="text-gray-600 mt-1">Receipt #{selectedPayment.orderId || selectedPayment.referenceNumber || selectedPayment._id}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {renderDetailField('Payment Date', formatDate(selectedPayment.createdAt))}
              {renderDetailField('Payment Method', selectedPayment.paymentMethod || selectedPayment.method || 'PayHere')}
              {renderDetailField('Invoice Number', selectedPayment.invoiceNumber || invoice.invoiceNumber)}
              {renderDetailField('Invoice ID', invoice._id || selectedPayment.invoiceId)}
              {renderDetailField('Task ID', selectedPayment.taskId || invoice.taskId || issue._id)}
              {renderDetailField('Task Name', selectedPayment.taskName || invoice.taskName || issue.issueType)}
              {renderDetailField('Issue Type', selectedPayment.issueType || issue.issueType)}
              {renderDetailField('Location', `${selectedPayment.building || getBuildingLabel(issue.building) || '—'}, Unit ${selectedPayment.unitNumber || '—'}`)}
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-700 font-medium">Amount Paid</span>
                <span className="text-3xl font-bold text-green-600">LKR {Number(selectedPayment.amount || 0).toFixed(2)}</span>
              </div>
              <div className="text-sm text-gray-600">Status: {formatStatusLabel(selectedPayment.issueStatus || selectedPayment.status)}</div>
            </div>

            {(selectedPayment.description || invoice.issueTitle || selectedPayment.taskName) && (
              <div className="mb-6">
                <p className="text-xs text-gray-600 font-semibold mb-2">Description</p>
                <p className="text-gray-800">{selectedPayment.description || invoice.issueTitle || selectedPayment.taskName}</p>
              </div>
            )}

            {(selectedPayment.payherePaymentId || selectedPayment.transactionId || selectedPayment.orderId) && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-600 font-semibold mb-1">Payment Reference</p>
                <p className="text-blue-800 font-mono text-sm">{selectedPayment.payherePaymentId || selectedPayment.transactionId || selectedPayment.orderId}</p>
              </div>
            )}
          </div>

          {/* Actions */}
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
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Payment History</h2>
        <p className="text-gray-600 mt-1">View all your payment transactions and receipts</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {visiblePayments.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 text-lg">No payment-done tasks yet</p>
          <p className="text-gray-400 text-sm mt-2">Only tasks with a payment done status appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {visiblePayments.map((payment) => (
            <div
              key={payment._id}
              className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {payment.taskName || payment.issueLabel || payment.invoiceNumber || 'Payment for Invoice'}
                    </h3>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                      ✓ {formatStatusLabel(payment.issueStatus || payment.status || 'payment done')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-600">Payment Date</p>
                      <p className="font-medium text-gray-800">{formatDate(payment.paymentDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Amount Paid</p>
                      <p className="font-bold text-green-600">LKR {Number(payment.amount || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Invoice Number</p>
                      <p className="font-medium text-gray-800">{payment.invoiceNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Invoice ID</p>
                      <p className="font-mono text-gray-800 text-sm">{payment.invoiceId}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-600">Task ID</p>
                      <p className="font-mono text-gray-800 text-sm">{payment.taskId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Task Name</p>
                      <p className="font-medium text-gray-800">{payment.taskName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Issue</p>
                      <p className="font-medium text-gray-800">{payment.issueLabel}</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600">
                    Location: {payment.building}, Unit {payment.unitNumber}
                  </p>
                </div>

                <button
                  onClick={() => openDetails(payment)}
                  className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition whitespace-nowrap"
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
