import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authAPI, issueAPI } from '../api';
import AdminSidebar from '../components/AdminSidebar';
import ProfileDropdown from '../components/ProfileDropdown';
import IssueMediaGallery from '../components/IssueMediaGallery';
import usePolling from '../hooks/usePolling';
import { broadcastStatusRefresh } from '../utils/statusRefresh';
import { formatStatusLabel, getStatusBadgeTheme, normalizeStatus } from '../utils/issueStatus';
import { getUserProfileImage } from '../utils/profileImage';

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

const REPAIR_STATUS_FLOW = [
  { value: 'new', label: 'New', dot: 'bg-blue-600', bar: 'bg-blue-500' },
  { value: 'assigned', label: 'Assigned', dot: 'bg-blue-600', bar: 'bg-blue-500' },
  { value: 'in progress', label: 'In Progress', dot: 'bg-emerald-600', bar: 'bg-emerald-500' },
  { value: 'tenant confirmed', label: 'Tenant Confirmed', dot: 'bg-purple-600', bar: 'bg-purple-500' },
  { value: 'completed', label: 'Completed', dot: 'bg-amber-500', bar: 'bg-amber-400' },
  { value: 'cost report submitted', label: 'Cost Report Submitted', dot: 'bg-violet-600', bar: 'bg-violet-500' },
  { value: 'invoice issued', label: 'Invoice Issued', dot: 'bg-sky-600', bar: 'bg-sky-500' },
  { value: 'payment done', label: 'Payment Done', dot: 'bg-emerald-600', bar: 'bg-emerald-500' },
  { value: 'task done', label: 'Task Done', dot: 'bg-teal-600', bar: 'bg-teal-500' },
];

const buildRepairTimeline = (issue) => {
  const currentStatus = normalizeStatus(issue?.status || 'new');
  const historyEntries = Array.isArray(issue?.statusHistory) ? issue.statusHistory : [];
  const historyMap = new Map();

  historyEntries.forEach((entry) => {
    const normalized = normalizeStatus(entry.status);
    if (!normalized) return;
    historyMap.set(normalized, entry);
  });

  const currentIndex = REPAIR_STATUS_FLOW.findIndex((step) => step.value === currentStatus);

  return REPAIR_STATUS_FLOW.map((step, index) => {
    const historyEntry = historyMap.get(step.value);
    const reached = currentIndex >= 0 ? index <= currentIndex : Boolean(historyEntry) || step.value === currentStatus;

    return {
      ...step,
      reached,
      active: step.value === currentStatus,
      timestamp: historyEntry?.changedAt || (step.value === currentStatus ? issue?.updatedAt || issue?.createdAt : null),
      reason: historyEntry?.reason || '',
    };
  });
};

export default function AdminRepairDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [profileName, setProfileName] = useState('Property Manager');
  const [profileImage, setProfileImage] = useState('');
  const [unassigning, setUnassigning] = useState(false);

  const loadIssue = useCallback(async () => {
    if (!id || role !== 'admin') return;
    try {
      const [issueResponse, profileResponse] = await Promise.all([
        issueAPI.getById(id),
        authAPI.getProfile()
      ]);
      setIssue(issueResponse?.data?.issue || null);
      const user = profileResponse?.data?.user || {};
      setProfileName(user.name || 'Property Manager');
      setProfileImage(getUserProfileImage(user));
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

  const markTaskDone = async () => {
    if (!issue?._id) return;
    setUpdating(true);
    try {
      await issueAPI.update(issue._id, { status: 'task done' });
      broadcastStatusRefresh();
      await loadIssue();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark task as done.');
    } finally {
      setUpdating(false);
    }
  };

  const handleUnassign = async () => {
    if (!issue?._id) return;
    const confirmed = window.confirm(
      `Unassign ${issue.assignedTo?.name || 'this staff member'} from this task? It will return to the unassigned queue.`
    );
    if (!confirmed) return;
    setUnassigning(true);
    try {
      await issueAPI.update(issue._id, { assignedTo: null });
      broadcastStatusRefresh();
      await loadIssue();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unassign task.');
    } finally {
      setUnassigning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F8] text-[#1D1D2C] flex">
      <AdminSidebar active="repairs" profileName={profileName} />

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

                <div className="mt-5 rounded-xl border border-[#E5E8F1] bg-[#F8F9FC] p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="text-[11px] font-semibold text-[#8A96B7] uppercase tracking-wide">Status Lifecycle</p>
                      <p className="text-xs text-[#7681A8] mt-1">Live updates while this task is open</p>
                    </div>
                    <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-semibold ${getStatusBadgeTheme(issue.status, 'pill').className}`}>
                      {formatStatusLabel(issue.status)}
                    </span>
                  </div>

                  <div className="overflow-x-auto pb-2">
                    <div className="flex items-start min-w-[760px]">
                      {buildRepairTimeline(issue).map((step, index, steps) => (
                        <div key={step.value} className="flex items-start flex-1 min-w-[92px]">
                          <div className="flex flex-col items-center flex-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition ${step.reached ? step.dot : 'bg-white border-[#D7DBE8]'}`}>
                              <span className={`text-[10px] font-black ${step.reached ? 'text-white' : 'text-[#9AA4C3]'}`}>
                                {index + 1}
                              </span>
                            </div>
                            <p className={`mt-2 text-[10px] leading-tight text-center font-semibold ${step.active ? 'text-[#171A2A]' : step.reached ? 'text-[#4B5678]' : 'text-[#A1A9C7]'}`}>
                              {step.label}
                            </p>
                            <p className="mt-1 text-[10px] text-center text-[#8A96B7] min-h-[1.5rem]">
                              {step.timestamp ? new Date(step.timestamp).toLocaleString() : 'Pending'}
                            </p>
                            {step.reason && (
                              <p className="mt-1 text-[10px] text-center text-[#7B87AD] max-w-[95px] line-clamp-2">
                                {step.reason}
                              </p>
                            )}
                          </div>
                          {index < steps.length - 1 && (
                            <div className="flex-1 px-2 pt-4">
                              <div className={`h-1 rounded-full transition ${step.reached ? step.bar : 'bg-[#DDE2F0]'}`} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
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
                      {issue.scheduledStartDate && (
                        <div className="rounded-lg bg-[#FFF8EC] border border-[#FFE5A0] p-3 sm:col-span-2">
                          <p className="text-[11px] text-[#B97D00] font-semibold">📅 Scheduled Start</p>
                          <p className="font-semibold text-[#2A2E3F] mt-0.5">
                            {new Date(issue.scheduledStartDate).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                            {issue.scheduledStartTime && (
                              <span className="ml-2 text-[#596080] font-normal">at {issue.scheduledStartTime}</span>
                            )}
                          </p>
                        </div>
                      )}
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
                <div className="flex items-center gap-3">
                  {/* Unassign button — only shown when task is assigned/in-progress and has a staff member */}
                  {issue.assignedTo && ['assigned', 'in progress'].includes(normalizeStatus(issue.status)) && (
                    <button
                      type="button"
                      disabled={unassigning}
                      onClick={handleUnassign}
                      className="px-5 py-2.5 rounded-lg border border-red-300 text-red-600 bg-white text-sm font-semibold hover:bg-red-50 disabled:opacity-60 transition"
                    >
                      {unassigning ? 'Unassigning...' : '↩ Unassign Staff'}
                    </button>
                  )}
                  {normalizeStatus(issue.status) === 'payment done' && (
                    <button
                      type="button"
                      disabled={updating}
                      onClick={markTaskDone}
                      className="px-5 py-2.5 rounded-lg bg-[#0E9F6E] text-white text-sm font-semibold disabled:opacity-70"
                    >
                      {updating ? 'Updating...' : 'Mark Task Done'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate('/admin/in-progress-repairs')}
                    className="px-5 py-2.5 rounded-lg border border-[#D7DBE8] bg-white text-sm font-semibold"
                  >
                    Back to Repairs
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}