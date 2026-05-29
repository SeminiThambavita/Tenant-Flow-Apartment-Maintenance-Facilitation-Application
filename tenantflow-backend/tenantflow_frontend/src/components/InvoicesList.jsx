import { useEffect, useState } from 'react';
import { invoiceAPI, paymentAPI } from '../api';

export default function InvoicesList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payingInvoice, setPayingInvoice] = useState(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await invoiceAPI.getAll();
      setInvoices(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load invoices');
      console.error('Error loading invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async (invoice) => {
    try {
      // Initiate PayHere payment
      const response = await paymentAPI.initiate({
        invoiceId: invoice._id,
        amount: invoice.total,
        issueId: invoice.issue
      });

      // Redirect to PayHere sandbox
      if (response.data.paymentUrl) {
        window.location.href = response.data.paymentUrl;
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to initiate payment');
      console.error('Payment initiation error:', err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'submitted':
        return 'bg-sky-100 text-sky-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status) => {
    if (String(status || '').toLowerCase() === 'submitted') return 'Invoice Submitted';
    if (String(status || '').toLowerCase() === 'paid') return 'Payment Successful';
    return String(status || '').charAt(0).toUpperCase() + String(status || '').slice(1);
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Loading invoices...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Invoices</h2>
        <p className="text-gray-600 mt-1">View and pay your invoices</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 text-lg">No invoices yet</p>
          <p className="text-gray-400 text-sm mt-2">Your invoices will appear here once they are issued</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {invoices.map((invoice) => (
            <div
              key={invoice._id}
              className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{invoice.invoiceNumber}</h3>
                    <p className="text-sm text-gray-600 mt-1">{invoice.issueTitle}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(invoice.status)}`}>
                    {formatStatus(invoice.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-xs text-gray-600">Issue Type</p>
                    <p className="font-medium text-gray-800 capitalize">{invoice.issueType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Location</p>
                    <p className="font-medium text-gray-800">{invoice.location?.building}, Unit {invoice.location?.unitNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Issued Date</p>
                    <p className="font-medium text-gray-800">{new Date(invoice.issuedAt).toLocaleDateString()}</p>
                  </div>
                  {invoice.dueDate && (
                    <div>
                      <p className="text-xs text-gray-600">Due Date</p>
                      <p className="font-medium text-gray-800">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                {/* Cost Breakdown */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">Cost Breakdown</h4>
                  <div className="space-y-2 text-sm mb-3 border-b border-gray-300 pb-3">
                    {invoice.costBreakdown?.laborCost > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Labor Cost</span>
                        <span className="font-medium">LKR {invoice.costBreakdown.laborCost.toFixed(2)}</span>
                      </div>
                    )}
                    {invoice.costBreakdown?.materialsCost > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Materials Cost</span>
                        <span className="font-medium">LKR {invoice.costBreakdown.materialsCost.toFixed(2)}</span>
                      </div>
                    )}
                    {invoice.costBreakdown?.transportCost > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Transport Cost</span>
                        <span className="font-medium">LKR {invoice.costBreakdown.transportCost.toFixed(2)}</span>
                      </div>
                    )}
                    {invoice.costBreakdown?.otherCost > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Other Cost</span>
                        <span className="font-medium">LKR {invoice.costBreakdown.otherCost.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800">Total Amount</span>
                    <span className="text-2xl font-bold text-blue-600">LKR {invoice.total.toFixed(2)}</span>
                  </div>
                </div>

                {invoice.notes && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-600 mb-1">Notes</p>
                    <p className="text-sm text-gray-700">{invoice.notes}</p>
                  </div>
                )}

                {/* Payment Section */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  {(invoice.status === 'submitted' || invoice.status === 'pending') && (
                    <button
                      onClick={() => handlePayNow(invoice)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
                    >
                      💳 Pay Now
                    </button>
                  )}
                  {invoice.status === 'paid' && (
                    <button
                      className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium cursor-default"
                    >
                      ✓ Paid on {new Date(invoice.paidAt).toLocaleDateString()}
                    </button>
                  )}
                  {invoice.status === 'overdue' && (
                    <button
                      onClick={() => handlePayNow(invoice)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
                    >
                      ⚠️ Pay Now (Overdue)
                    </button>
                  )}
                  <button
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                  >
                    📄 View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
