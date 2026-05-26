import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { issueAPI } from '../api';
import StaffNav from '../components/StaffNav';
import IssueMediaGallery from '../components/IssueMediaGallery';
import usePolling from '../hooks/usePolling';
import { formatStatusLabel, normalizeStatus } from '../utils/issueStatus';

const ISSUE_LABELS = {
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  cleaning: 'Cleaning',
  carpentry: 'Carpentry',
  other: 'Other',
};

export default function StaffTaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [profileName, setProfileName] = useState('Staff Member');

  const loadIssue = useCallback(async () => {
    if (!id || role !== 'staff') return;
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
    if (role !== 'staff') {
      navigate('/login', { state: { role: 'staff' } });
      return;
    }
    loadIssue();
  }, [role, navigate, loadIssue]);

  usePolling(loadIssue, 5000, role === 'staff' && Boolean(id));

  const updateStatus = async (nextStatus) => {
    setUpdating(true);
    setError('');
    try {
      const response = await issueAPI.update(id, { status: nextStatus });
      setIssue(response?.data?.issue || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task status.');
    } finally {
      setUpdating(false);
    }
  };

  const statusKey = normalizeStatus(issue?.status);
  const canStart = statusKey === 'new' || statusKey === 'assigned';
  const canComplete = statusKey === 'in progress';

  return (
    <div className="min-h-screen bg-[#F4F5F9] text-[#171A2A]">
      <StaffNav active="dashboard" profileName={profileName || issue?.assignedTo?.name || 'Staff'} showBack backPath="/staff-dashboard" />

      <main className="max-w-3xl mx-auto pt-8 px-4 pb-12">
        {loading && !issue ? (
          <p className="text-sm text-[#7681A8]">Loading task...</p>
        ) : error && !issue ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{error}</div>
        ) : issue ? (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-[#E5E8F1] p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold text-[#8A96B7] uppercase tracking-wide">Assigned Task</p>
                  <h1 className="text-2xl font-semibold mt-1">
                    {ISSUE_LABELS[issue.issueType] || issue.issueType} — {issue.specificSpot}
                  </h1>
                  <p className="text-xs text-[#7681A8] mt-1">
                    Reported {new Date(issue.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#ECEEFF] text-[#3F46F0]">
                  {formatStatusLabel(issue.status)}
                </span>
              </div>

              {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="bg-[#F8F9FC] rounded-lg p-3">
                  <p className="text-[11px] text-[#7681A8] font-semibold">Tenant</p>
                  <p className="font-medium">{issue.tenant?.name || '—'}</p>
                  <p className="text-xs text-[#7B87AD]">{issue.tenant?.email || ''}</p>
                  <p className="text-xs text-[#7B87AD]">{issue.tenant?.phone || ''}</p>
                </div>
                <div className="bg-[#F8F9FC] rounded-lg p-3">
                  <p className="text-[11px] text-[#7681A8] font-semibold">Location</p>
                  <p className="font-medium">{issue.building}</p>
                  <p className="text-xs text-[#7B87AD]">Unit {issue.unitNumber}</p>
                  <p className="text-xs text-[#7B87AD]">{issue.specificSpot}</p>
                </div>
                <div className="sm:col-span-2 bg-[#F8F9FC] rounded-lg p-3">
                  <p className="text-[11px] text-[#7681A8] font-semibold">Priority</p>
                  <p className="font-medium capitalize">{issue.priority || 'medium'}</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-[11px] text-[#7681A8] font-semibold mb-1">Description</p>
                <p className="text-sm text-[#2A2E3F]">{issue.description || 'No description provided.'}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E5E8F1] p-5 shadow-sm">
              <p className="text-sm font-semibold mb-3">Attachments</p>
              <IssueMediaGallery media={issue.media} />
            </div>

            <div className="flex flex-wrap gap-3">
              {canStart && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => updateStatus('in progress')}
                  className="px-5 py-2.5 rounded-lg bg-[#3F46F0] text-white text-sm font-semibold disabled:opacity-70"
                >
                  {updating ? 'Updating...' : 'Start Work (In Progress)'}
                </button>
              )}
              {canComplete && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => updateStatus('completed')}
                  className="px-5 py-2.5 rounded-lg bg-[#0E9F6E] text-white text-sm font-semibold disabled:opacity-70"
                >
                  {updating ? 'Updating...' : 'Mark as Completed'}
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate('/staff-dashboard')}
                className="px-5 py-2.5 rounded-lg border border-[#D7DBE8] bg-white text-sm font-semibold"
              >
                Back to Tasks
              </button>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
