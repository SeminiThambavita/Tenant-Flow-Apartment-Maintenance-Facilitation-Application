import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { costReportAPI, issueAPI } from '../api';
import StaffNav from '../components/StaffNav';
import usePolling from '../hooks/usePolling';
import { formatStatusLabel, getStatusBadgeTheme, normalizeStatus } from '../utils/issueStatus';

const emptyItem = () => ({
  itemName: '',
  category: 'materials',
  description: '',
  quantity: 1,
  unitCost: 0,
  hours: 0,
  rate: 0,
  cost: 0,
});

const getBuildingLabel = (value) => {
  if (!value) return '—';
  if (typeof value === 'string') return value;
  return value.name || '—';
};

const getLineItemCost = (item) => {
  const category = String(item.category || 'materials').toLowerCase();
  const quantity = Number(item.quantity || 0);
  const unitCost = Number(item.unitCost || 0);
  const hours = Number(item.hours || 0);
  const rate = Number(item.rate || 0);

  if (category === 'labor') {
    if (hours > 0 && rate > 0) return hours * rate;
    if (quantity > 0 && rate > 0) return quantity * rate;
    return Number(item.cost || 0);
  }

  if (quantity > 0 && unitCost > 0) return quantity * unitCost;
  return Number(item.cost || 0);
};

export default function StaffCostReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const [issue, setIssue] = useState(null);
  const [costReport, setCostReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([emptyItem()]);

  const loadData = useCallback(async ({ syncForm = false } = {}) => {
    if (!id || role !== 'staff') return;

    try {
      const [issueResponse, costReportsResponse] = await Promise.all([
        issueAPI.getById(id),
        costReportAPI.getByIssue(id),
      ]);

      const loadedIssue = issueResponse?.data?.issue || null;
      setIssue(loadedIssue);

      const reports = costReportsResponse?.data?.costReports || [];
      const preferredReport =
        reports.find((report) => normalizeStatus(report.status) === 'draft') ||
        reports.find((report) => normalizeStatus(report.status) === 'rejected') ||
        reports.find((report) => normalizeStatus(report.status) === 'submitted') ||
        reports.find((report) => normalizeStatus(report.status) === 'approved') ||
        [...reports].sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())[0] ||
        null;

      if (preferredReport) {
        setCostReport(preferredReport);
        if (syncForm) {
          setNotes(preferredReport.notes || '');
          setItems(
            preferredReport.costItems?.length > 0
              ? preferredReport.costItems.map((item) => ({
                  itemName: item.itemName || '',
                  category: item.category || 'materials',
                  description: item.description || '',
                  quantity: item.quantity ?? 1,
                  unitCost: item.unitCost ?? 0,
                  hours: item.hours ?? 0,
                  rate: item.rate ?? 0,
                  cost: item.cost ?? 0,
                }))
              : [emptyItem()]
          );
        }
      } else {
        const createResponse = await costReportAPI.create({ issueId: id });
        const createdReport = createResponse?.data?.costReport || null;
        setCostReport(createdReport);
        if (syncForm) {
          setNotes('');
          setItems([emptyItem()]);
        }
      }

      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load cost report template.');
    } finally {
      setLoading(false);
    }
  }, [id, role]);

  useEffect(() => {
    if (role !== 'staff') {
      navigate('/login', { state: { role: 'staff' } });
      return;
    }
    loadData({ syncForm: true });
  }, [role, navigate, loadData]);

  usePolling(() => loadData(), 5000, role === 'staff' && Boolean(id));

  const canEdit = useMemo(() => {
    const status = normalizeStatus(costReport?.status);
    return !status || status === 'draft' || status === 'rejected';
  }, [costReport?.status]);

  const totalCost = useMemo(() => items.reduce((sum, item) => sum + getLineItemCost(item), 0), [items]);

  const updateItem = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value,
      };

      next[index].cost = getLineItemCost(next[index]);
      return next;
    });
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (index) => {
    setItems((prev) => (prev.length === 1 ? [emptyItem()] : prev.filter((_, itemIndex) => itemIndex !== index)));
  };

  const saveTemplate = async () => {
    if (!costReport?._id) return;
    setSaving(true);
    setError('');
    setSuccessMessage('');
    try {
      await costReportAPI.update(costReport._id, {
        costItems: items.map((item) => ({
          ...item,
          cost: getLineItemCost(item),
        })),
        notes,
      });
      navigate('/staff-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save cost report template.');
    } finally {
      setSaving(false);
    }
  };

  const submitForApproval = async () => {
    if (!costReport?._id) return;
    if (items.every((item) => !item.itemName.trim())) {
      setError('Add at least one cost line before submitting.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMessage('');
    try {
      await costReportAPI.update(costReport._id, {
        costItems: items.map((item) => ({
          ...item,
          cost: getLineItemCost(item),
        })),
        notes,
      });
      await costReportAPI.submit(costReport._id);
      setSuccessMessage('Cost report successfully submitted for approval.');
      await loadData({ syncForm: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send cost report for approval.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F9] text-[#171A2A]">
      <StaffNav active="dashboard" profileName={issue?.assignedTo?.name || 'Staff'} showBack backPath={`/staff/tasks/${id}`} />
      <main className="max-w-5xl mx-auto px-4 py-8 pb-12">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-[11px] font-semibold text-[#8A96B7] uppercase tracking-wide">Cost Report Template</p>
            <h1 className="text-3xl font-semibold mt-1">{issue ? `${formatStatusLabel(issue.status)} task` : 'Loading...'}</h1>
            <p className="text-sm text-[#7681A8] mt-1">
              {getBuildingLabel(issue?.building)} • Unit {issue?.unit || '—'} • {issue?.specificSpot || '—'}
            </p>
            {costReport?.status === 'rejected' && costReport.rejectionRemarks && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 max-w-3xl">
                <p className="font-semibold">This cost report was rejected</p>
                <p className="mt-1">Remarks: {costReport.rejectionRemarks}</p>
              </div>
            )}
          </div>
          {costReport && (
            <span className={`inline-flex items-center justify-center min-w-[8.5rem] px-3.5 py-1 rounded-full whitespace-nowrap text-xs font-semibold ${getStatusBadgeTheme(costReport.status, 'pill').className}`}>
              {getStatusBadgeTheme(costReport.status, 'pill').text}
            </span>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-[#E5E8F1] p-6 text-sm text-[#7681A8]">Loading cost report...</div>
        ) : error && !issue ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{error}</div>
        ) : issue ? (
          <div className="space-y-4">
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 text-sm font-medium">
                {successMessage}
              </div>
            )}
            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{error}</div>}

            <section className="bg-white rounded-xl border border-[#E5E8F1] p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold text-[#8A96B7] uppercase tracking-wide">Issue Summary</p>
                  <h2 className="text-xl font-semibold mt-1">{issue.issueType} - {String(issue.specificSpot || 'general area').toLowerCase()}</h2>
                  <p className="text-sm text-[#7681A8] mt-1">Reported {issue.createdAt ? new Date(issue.createdAt).toLocaleString() : '—'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/staff/tasks/${id}`)}
                  className="px-4 py-2 rounded-lg border border-[#D7DBE8] bg-white text-sm font-semibold"
                >
                  Back to Task
                </button>
              </div>
            </section>

            <section className="bg-white rounded-xl border border-[#E5E8F1] p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#171A2A]">Cost Template</h3>
                  <p className="text-sm text-[#7681A8]">Add labor, materials, transport, or other costs. Total updates automatically in LKR.</p>
                </div>
                <button
                  type="button"
                  onClick={addItem}
                  disabled={!canEdit}
                  className="px-4 py-2 rounded-lg bg-[#3F46F0] text-white text-sm font-semibold disabled:opacity-60"
                >
                  + Add Line
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => {
                  const isLabor = String(item.category || 'materials').toLowerCase() === 'labor';
                  const lineTotal = getLineItemCost(item);

                  return (
                    <div key={index} className="rounded-xl border border-[#E5E8F1] bg-[#F8F9FC] p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#7681A8] mb-1">Item</label>
                          <input
                            type="text"
                            value={item.itemName}
                            onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                            disabled={!canEdit}
                            placeholder={isLabor ? 'Labour' : 'Pipe, tiles, cement...'}
                            className="w-full rounded-lg border border-[#D7DBE8] bg-white px-3 py-2 text-sm disabled:bg-[#EEF1F6]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#7681A8] mb-1">Category</label>
                          <select
                            value={item.category}
                            onChange={(e) => updateItem(index, 'category', e.target.value)}
                            disabled={!canEdit}
                            className="w-full rounded-lg border border-[#D7DBE8] bg-white px-3 py-2 text-sm disabled:bg-[#EEF1F6]"
                          >
                            <option value="materials">Materials</option>
                            <option value="labor">Labor</option>
                            <option value="transport">Transport</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="block text-xs font-semibold text-[#7681A8] mb-1">Description</label>
                        <textarea
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          disabled={!canEdit}
                          rows="2"
                          placeholder="Optional notes about this cost line"
                          className="w-full rounded-lg border border-[#D7DBE8] bg-white px-3 py-2 text-sm disabled:bg-[#EEF1F6]"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        {isLabor ? (
                          <>
                            <div>
                              <label className="block text-xs font-semibold text-[#7681A8] mb-1">Labour Hrs</label>
                              <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={item.hours}
                                onChange={(e) => updateItem(index, 'hours', Number(e.target.value || 0))}
                                disabled={!canEdit}
                                className="w-full rounded-lg border border-[#D7DBE8] bg-white px-3 py-2 text-sm disabled:bg-[#EEF1F6]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-[#7681A8] mb-1">Labour Rate (LKR/hr)</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.rate}
                                onChange={(e) => updateItem(index, 'rate', Number(e.target.value || 0))}
                                disabled={!canEdit}
                                className="w-full rounded-lg border border-[#D7DBE8] bg-white px-3 py-2 text-sm disabled:bg-[#EEF1F6]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-[#7681A8] mb-1">Qty</label>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, 'quantity', Number(e.target.value || 0))}
                                disabled={!canEdit}
                                className="w-full rounded-lg border border-[#D7DBE8] bg-white px-3 py-2 text-sm disabled:bg-[#EEF1F6]"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <label className="block text-xs font-semibold text-[#7681A8] mb-1">Quantity</label>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, 'quantity', Number(e.target.value || 0))}
                                disabled={!canEdit}
                                className="w-full rounded-lg border border-[#D7DBE8] bg-white px-3 py-2 text-sm disabled:bg-[#EEF1F6]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-[#7681A8] mb-1">Unit Cost (LKR)</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitCost}
                                onChange={(e) => updateItem(index, 'unitCost', Number(e.target.value || 0))}
                                disabled={!canEdit}
                                className="w-full rounded-lg border border-[#D7DBE8] bg-white px-3 py-2 text-sm disabled:bg-[#EEF1F6]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-[#7681A8] mb-1">Amount (LKR)</label>
                              <div className="rounded-lg border border-[#D7DBE8] bg-white px-3 py-2 text-sm font-semibold text-[#171A2A]">
                                {lineTotal.toFixed(2)}
                              </div>
                            </div>
                          </>
                        )}

                        <div className="flex items-end justify-end">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            disabled={!canEdit}
                            className="px-3 py-2 rounded-lg border border-red-200 text-red-600 bg-white text-sm font-semibold disabled:opacity-60"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {isLabor && (
                        <div className="mt-3 rounded-lg bg-white border border-[#D7DBE8] px-3 py-2 text-sm flex items-center justify-between">
                          <span className="text-[#7681A8]">Calculated Amount</span>
                          <span className="font-semibold text-[#171A2A]">LKR {lineTotal.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#7681A8] mb-1">Additional Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={!canEdit}
                    rows="3"
                    className="w-full rounded-lg border border-[#D7DBE8] bg-white px-3 py-2 text-sm disabled:bg-[#EEF1F6]"
                    placeholder="Any extra explanation for the manager"
                  />
                </div>

                <div className="rounded-xl border border-[#D7DBE8] bg-[#F8F9FC] p-4 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#7681A8] uppercase tracking-wide">Grand Total</p>
                    <p className="text-3xl font-bold text-[#3346F2] mt-2">LKR {totalCost.toFixed(2)}</p>
                  </div>
                  <p className="text-xs text-[#7681A8] mt-2">All amounts are automatically summed in LKR.</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={saveTemplate}
                  disabled={!canEdit || saving}
                  className="px-5 py-2.5 rounded-lg border border-[#D7DBE8] bg-white text-sm font-semibold disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Template'}
                </button>
                <button
                  type="button"
                  onClick={submitForApproval}
                  disabled={!canEdit || saving}
                  className="px-5 py-2.5 rounded-lg bg-[#0E9F6E] text-white text-sm font-semibold disabled:opacity-60"
                >
                  {saving ? 'Sending...' : 'Send for Approval'}
                </button>
              </div>

              {costReport && !canEdit && (
                <p className="mt-3 text-sm text-[#7681A8]">
                  This report is currently {formatStatusLabel(costReport.status).toLowerCase()} and cannot be edited until it is rejected.
                </p>
              )}
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}