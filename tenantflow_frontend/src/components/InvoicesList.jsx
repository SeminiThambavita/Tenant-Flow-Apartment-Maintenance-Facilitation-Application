import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoiceAPI } from '../api';
import usePolling from '../hooks/usePolling';
import { formatStatusLabel } from '../utils/issueStatus';

const getBuildingLabel = (building) => {
  if (!building) return '—';
  if (typeof building === 'string') return building;
  return building.name || building.address || '—';
};

const getIssueLabel = (invoice) => {
  const issue = invoice.issue;
  const type = issue?.issueType || invoice.issueType || 'Maintenance';
  const spot = issue?.specificSpot || issue?.description || '';
  return spot ? `${type} - ${spot}` : type;
};

const normalizeInvoice = (invoice) => ({
  ...invoice,
  locationLabel: `${getBuildingLabel(invoice.location?.building || invoice.issue?.building)} , Unit ${invoice.location?.unitNumber || invoice.issue?.unitNumber || invoice.issue?.unit || '—'}`.replace(' ,', ','),
  relatedIssueLabel: getIssueLabel(invoice),
  location: {
    ...invoice.location,
    building: getBuildingLabel(invoice.location?.building),
    unitNumber: invoice.location?.unitNumber || invoice.issue?.unitNumber || invoice.issue?.unit || '—'
  }
});

export default function InvoicesList() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await invoiceAPI.getAll();
      setInvoices((response.data.invoices || []).map(normalizeInvoice));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load invoices');
      console.error('Error loading invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  usePolling(loadInvoices, 5000, true);

  const handlePayNow = (invoice) => {
    if (!invoice?._id) {
      return;
    }

    localStorage.setItem('pendingInvoiceId', invoice._id);
    localStorage.setItem('pendingInvoiceLabel', invoice.invoiceNumber || invoice.issueTitle || 'Maintenance Payment');
    navigate('/payment', { state: { invoice } });
  };

  const openInvoiceDetails = async (invoice) => {
    setDetailsLoading(true);
    setDetailsError('');
    try {
      const response = await invoiceAPI.getById(invoice._id);
      setSelectedInvoice(response.data.invoice);
    } catch (err) {
      setDetailsError(err.response?.data?.message || 'Failed to load invoice details');
      setSelectedInvoice(invoice);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeInvoiceDetails = () => {
    setSelectedInvoice(null);
    setDetailsError('');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700';
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
    if (String(status || '').toLowerCase() === 'draft') return 'Draft';
    if (String(status || '').toLowerCase() === 'submitted') return 'Invoice Submitted';
    if (String(status || '').toLowerCase() === 'paid') return formatStatusLabel('payment done');
    return formatStatusLabel(status);
  };

  const getIssueValue = (issue, key, fallback = '—') => {
    if (!issue) return fallback;
    const value = issue[key];
    if (value == null || value === '') return fallback;
    if (typeof value === 'object' && value.name) return value.name;
    return value;
  };

  const selectedCostReport = selectedInvoice?.costReport || selectedInvoice?.issue?.currentCostReport || null;

  const formatPaidDate = (value) => {
    if (!value) return 'Paid';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Paid';
    return `Paid on ${date.toLocaleDateString()}`;
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
                    <p className="text-xs text-gray-500 mt-1">Task: {invoice.taskId || invoice.issue?._id || invoice.issue}</p>
                    <p className="text-xs text-gray-500 mt-1">Related Issue: {invoice.relatedIssueLabel || getIssueLabel(invoice)}</p>
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
                    <p className="font-medium text-gray-800">{invoice.locationLabel || `${getBuildingLabel(invoice.location?.building)}, Unit ${invoice.location?.unitNumber || '—'}`}</p>
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
                      ✓ {formatPaidDate(invoice.paidAt)}
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
                    type="button"
                    onClick={() => openInvoiceDetails(invoice)}
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

      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice Details</p>
                <h3 className="mt-1 text-2xl font-bold text-slate-900">{selectedInvoice.invoiceNumber}</h3>
                <p className="mt-1 text-sm text-slate-500">{selectedInvoice.issueTitle || 'Maintenance invoice'}</p>
              </div>
              <button
                type="button"
                onClick={closeInvoiceDetails}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            {detailsError && (
              <div className="mx-6 mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {detailsError}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {detailsLoading && !selectedInvoice.issue ? (
                <p className="text-sm text-slate-500">Loading full task details...</p>
              ) : (
                <>
                  <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 lg:col-span-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice Summary</p>
                      <div className="mt-3 space-y-2 text-sm text-slate-700">
                        <div className="flex justify-between gap-3"><span className="font-medium">Status</span><span>{formatStatus(selectedInvoice.status)}</span></div>
                        <div className="flex justify-between gap-3"><span className="font-medium">Issued</span><span>{selectedInvoice.issuedAt ? new Date(selectedInvoice.issuedAt).toLocaleDateString() : '—'}</span></div>
                        <div className="flex justify-between gap-3"><span className="font-medium">Due</span><span>{selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString() : '—'}</span></div>
                        <div className="flex justify-between gap-3"><span className="font-medium">Total</span><span className="font-semibold text-blue-700">LKR {Number(selectedInvoice.total || 0).toFixed(2)}</span></div>
                        <div className="flex justify-between gap-3"><span className="font-medium">Task ID</span><span className="font-mono text-xs">{selectedInvoice.taskId || selectedInvoice.issue?._id || '—'}</span></div>
                      </div>
                      {selectedInvoice.notes && <p className="mt-4 text-sm text-slate-600">{selectedInvoice.notes}</p>}
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4 lg:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reported Issue</p>
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500 text-xs">Issue Type</p>
                          <p className="font-semibold text-slate-900 capitalize">{selectedInvoice.issue?.issueType || '—'}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Issue Status</p>
                          <p className="font-semibold text-slate-900">{selectedInvoice.issue?.status || '—'}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Location</p>
                          <p className="font-semibold text-slate-900">{selectedInvoice.locationLabel || '—'}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Urgency / Priority</p>
                          <p className="font-semibold text-slate-900">{selectedInvoice.issue?.urgency || '—'} / {selectedInvoice.issue?.priority || '—'}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Reported By</p>
                          <p className="font-semibold text-slate-900">{getIssueValue(selectedInvoice.issue?.tenant, 'name', '—')}</p>
                          <p className="text-xs text-slate-500">{getIssueValue(selectedInvoice.issue?.tenant, 'email', '')}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Assigned Staff</p>
                          <p className="font-semibold text-slate-900">{getIssueValue(selectedInvoice.issue?.assignedTo, 'name', '—')}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-slate-500 text-xs">Description</p>
                          <p className="font-medium text-slate-900 mt-1 whitespace-pre-wrap">{selectedInvoice.issue?.description || 'No description provided.'}</p>
                        </div>
                        {Array.isArray(selectedInvoice.issue?.media) && selectedInvoice.issue.media.length > 0 && (
                          <div className="md:col-span-2">
                            <p className="text-slate-500 text-xs mb-2">Attachments</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {selectedInvoice.issue.media.map((item, index) => (
                                <div key={`${item.url || index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                                  <p className="font-semibold capitalize">{item.type || 'file'}</p>
                                  <p className="break-all text-xs text-slate-500 mt-1">{item.filename || item.url}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cost Report</p>
                    {selectedCostReport ? (
                      <div className="mt-3 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500 text-xs">Status</p>
                            <p className="font-semibold text-slate-900 capitalize">{selectedCostReport.status || '—'}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs">Created By</p>
                            <p className="font-semibold text-slate-900">{getIssueValue(selectedCostReport.createdBy, 'name', '—')}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs">Submitted</p>
                            <p className="font-semibold text-slate-900">{selectedCostReport.submittedAt ? new Date(selectedCostReport.submittedAt).toLocaleDateString() : '—'}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs">Approved By</p>
                            <p className="font-semibold text-slate-900">{getIssueValue(selectedCostReport.approvedBy, 'name', '—')}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {['laborCost', 'materialsCost', 'transportCost', 'otherCost'].map((key) => (
                            <div key={key} className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                              <p className="text-[11px] uppercase tracking-wide text-slate-500">{key.replace('Cost', ' Cost')}</p>
                              <p className="mt-1 text-lg font-bold text-slate-900">LKR {Number(selectedCostReport.costBreakdown?.[key] || 0).toFixed(2)}</p>
                            </div>
                          ))}
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-900 mb-2">Cost Items</p>
                          {Array.isArray(selectedCostReport.costItems) && selectedCostReport.costItems.length > 0 ? (
                            <div className="overflow-x-auto rounded-lg border border-slate-200">
                              <table className="min-w-full text-sm">
                                <thead className="bg-slate-50 text-slate-600">
                                  <tr>
                                    <th className="px-3 py-2 text-left font-semibold">Item</th>
                                    <th className="px-3 py-2 text-left font-semibold">Category</th>
                                    <th className="px-3 py-2 text-right font-semibold">Qty</th>
                                    <th className="px-3 py-2 text-right font-semibold">Unit Cost</th>
                                    <th className="px-3 py-2 text-right font-semibold">Cost</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {selectedCostReport.costItems.map((item, index) => (
                                    <tr key={`${item.itemName || 'item'}-${index}`} className="border-t border-slate-200">
                                      <td className="px-3 py-2 text-slate-900">{item.itemName || '—'}</td>
                                      <td className="px-3 py-2 capitalize text-slate-600">{item.category || 'other'}</td>
                                      <td className="px-3 py-2 text-right text-slate-600">{item.quantity ?? 1}</td>
                                      <td className="px-3 py-2 text-right text-slate-600">LKR {Number(item.unitCost || 0).toFixed(2)}</td>
                                      <td className="px-3 py-2 text-right font-medium text-slate-900">LKR {Number(item.cost || 0).toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500">No cost items were recorded.</p>
                          )}
                        </div>

                        {selectedCostReport.rejectionRemarks && (
                          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                            <p className="font-semibold">Rejection Remarks</p>
                            <p className="mt-1">{selectedCostReport.rejectionRemarks}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">No cost report is linked to this invoice yet.</p>
                    )}
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
