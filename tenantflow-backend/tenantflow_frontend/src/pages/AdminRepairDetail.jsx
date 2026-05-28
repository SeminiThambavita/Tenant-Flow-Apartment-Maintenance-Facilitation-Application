import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { issueAPI } from '../api';
import AdminSidebar from '../components/AdminSidebar';
import IssueMediaGallery from '../components/IssueMediaGallery';
import usePolling from '../hooks/usePolling';
import { formatStatusLabel, getStatusBadgeTheme, normalizeStatus } from '../utils/issueStatus';

const getBuildingLabel = (value) => {
  if (!value) return '—';
  if (typeof value === 'string') return value;
  return value.name || '—';
};

const getIssueTypeLabel = (value) => {
  if (!value) return 'Other';
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
};

const getUrgencyLabel = (value) => {
  const normalized = String(value || 'standard').toLowerCase();
  if (normalized === 'urgent') return 'Urgent';
  if (normalized === 'low') return 'Low';
  return 'Standard';
};

const getSpecialArrangements = (value) => [
  { key: 'specialAccess', label: 'Special access arrangements' },
  { key: 'petsInUnit', label: 'Pets in the unit' },
  { key: 'callBeforeArriving', label: 'Call before arriving' },
].filter((item) => Boolean(value?.[item.key]));

export default function AdminRepairDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadIssue = useCallback(async () => {
    if (!id || role !== 'admin') return;
    try {
      const response = await issueAPI.getById(id);
      setIssue(response?.data?.issue || null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load task details.');
      setIssue(null);
    } finally {
      setLoading(false);
    }
  }, [id, role]);

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/login', { state: { role: 'admin' } });
      return;
    }
    loadIssue();
  }, [role, navigate, loadIssue]);

  usePolling(loadIssue, 5000, role === 'admin' && Boolean(id));

  const statusKey = useMemo(() => normalizeStatus(issue?.status), [issue?.status]);
  const specialArrangements = useMemo(() => getSpecialArrangements(issue?.specialArrangements), [issue?.specialArrangements]);
  const statusHistory = issue?.statusHistory || [];

  return (
    <div className="min-h-screen bg-[#F3F4F8] text-[#1D1D2C] flex">
      <AdminSidebar active="repairs" profileName="Property Manager" />

      <main className="flex-1 px-5 py-5">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => navigate('/admin/in-progress-repairs')}
              className="w-8 h-8 rounded-md border border-[#DCE0EE] text-[#596080] bg-white"
              aria-label="Back to in-progress repairs"
            >
              ←
            </button>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#7681A8] font-semibold">Task Detail</p>
              <h1 className="text-[28px] leading-tight font-semibold text-[#20253A]">Repair Issue Details</h1>
            </div>
          </div>

          {loading && !issue ? (
            <div className="bg-white rounded-xl border border-[#DDE2F0] p-5 text-[12px] text-[#7079A3]">Loading task...</div>
          ) : error && !issue ? (
            <div className="bg-white rounded-xl border border-red-200 p-5 text-sm text-red-700">{error}</div>
          ) : issue ? (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-[#DDE2F0] p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold text-[#8A96B7] uppercase tracking-wide">Assigned Task</p>
                    <h2 className="text-2xl font-semibold mt-1">{getIssueTypeLabel(issue.issueType)} - {String(issue.specificSpot || 'general area').toLowerCase()}</h2>
                    <p className="text-xs text-[#7681A8] mt-1">Reported {issue.createdAt ? new Date(issue.createdAt).toLocaleString() : '—'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center justify-center min-w-[8.5rem] px-3.5 py-1 rounded-full whitespace-nowrap text-xs font-semibold ${getStatusBadgeTheme(issue.status, 'pill').className}`}>
                      {getStatusBadgeTheme(issue.status, 'pill').text}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-[#8A96B7]">Status: {formatStatusLabel(issue.status)}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <section className="bg-white rounded-xl border border-[#DDE2F0] p-5 shadow-sm space-y-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-[#7681A8] font-semibold mb-2">Tenant</p>
                    <p className="font-semibold text-[#20253A]">{issue.tenant?.name || '—'}</p>
                    <p className="text-sm text-[#6A75A7]">{issue.tenant?.email || ''}</p>
                    <p className="text-sm text-[#6A75A7]">{issue.tenant?.phone || ''}</p>
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-[#7681A8] font-semibold mb-2">Staff Assignment</p>
                    <p className="font-semibold text-[#20253A]">{issue.assignedTo?.name || 'Unassigned'}</p>
                    <p className="text-sm text-[#6A75A7]">{issue.assignedTo?.staffType || issue.assignedTo?.role || '—'}</p>
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-[#7681A8] font-semibold mb-2">Location</p>
                    <p className="font-semibold text-[#20253A]">{getBuildingLabel(issue.building)}</p>
                    <p className="text-sm text-[#6A75A7]">{issue.building?.address ? `${issue.building.address}${issue.building.city ? `, ${issue.building.city}` : ''}` : ''}</p>
                    <p className="text-sm text-[#6A75A7]">Floor {issue.floor || '—'} • Unit {issue.unit || '—'}</p>
                    <p className="text-sm text-[#6A75A7]">Specific spot: {issue.specificSpot || '—'}</p>
                  </div>
                </section>

                <section className="bg-white rounded-xl border border-[#DDE2F0] p-5 shadow-sm space-y-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-[#7681A8] font-semibold mb-2">Report Details</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg bg-[#F8F9FC] p-3">
                        <p className="text-[11px] text-[#7681A8] font-semibold">Issue Type</p>
                        <p className="font-medium text-[#2A2E3F]">{getIssueTypeLabel(issue.issueType)}</p>
                      </div>
                      <div className="rounded-lg bg-[#F8F9FC] p-3">
                        <p className="text-[11px] text-[#7681A8] font-semibold">Urgency</p>
                        <p className="font-medium text-[#2A2E3F]">{getUrgencyLabel(issue.urgency)}</p>
                      </div>
                      <div className="rounded-lg bg-[#F8F9FC] p-3">
                        <p className="text-[11px] text-[#7681A8] font-semibold">Priority</p>
                        <p className="font-medium capitalize text-[#2A2E3F]">{issue.priority || 'medium'}</p>
                      </div>
                      <div className="rounded-lg bg-[#F8F9FC] p-3">
                        <p className="text-[11px] text-[#7681A8] font-semibold">Resolved At</p>
                        <p className="font-medium text-[#2A2E3F]">{issue.resolvedAt ? new Date(issue.resolvedAt).toLocaleString() : '—'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-[#F8F9FC] p-3">
                    <p className="text-[11px] text-[#7681A8] font-semibold mb-1">Description</p>
                    <p className="text-sm text-[#2A2E3F]">{issue.description || 'No description provided.'}</p>
                  </div>

                  <div className="rounded-lg bg-[#F8F9FC] p-3">
                    <p className="text-[11px] text-[#7681A8] font-semibold mb-2">Special Arrangements</p>
                    {specialArrangements.length > 0 ? (
                      <ul className="space-y-1 text-sm text-[#2A2E3F]">
                        {specialArrangements.map((item) => (
                          <li key={item.key}>• {item.label}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-[#6A75A7]">None selected</p>
                    )}
                  </div>
                </section>
              </div>

              <section className="bg-white rounded-xl border border-[#DDE2F0] p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="text-[11px] uppercase tracking-wide text-[#7681A8] font-semibold">Attachments</p>
                  <p className="text-xs text-[#6A75A7]">{issue.media?.length || 0} file(s)</p>
                </div>
                <IssueMediaGallery media={issue.media} />
              </section>

              <section className="bg-white rounded-xl border border-[#DDE2F0] p-5 shadow-sm">
                <p className="text-[11px] uppercase tracking-wide text-[#7681A8] font-semibold mb-3">Status History</p>
                {statusHistory.length > 0 ? (
                  <div className="space-y-3">
                    {statusHistory.map((entry, index) => (
                      <div key={`${entry.status}-${entry.changedAt || index}`} className="flex items-start justify-between gap-4 rounded-lg bg-[#F8F9FC] p-3">
                        <div>
                          <p className="font-semibold text-[#20253A]">{formatStatusLabel(entry.status)}</p>
                          <p className="text-sm text-[#6A75A7]">{entry.reason || 'Status update'}</p>
                        </div>
                        <p className="text-xs text-[#7681A8] whitespace-nowrap">{entry.changedAt ? new Date(entry.changedAt).toLocaleString() : '—'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#6A75A7]">No status history available.</p>
                )}
              </section>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/admin/in-progress-repairs')}
                  className="px-5 py-2.5 rounded-lg border border-[#D7DBE8] bg-white text-sm font-semibold"
                >
                  Back to Repairs
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}