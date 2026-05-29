import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { issueAPI } from '../api';
import StaffNav from '../components/StaffNav';
import IssueMediaGallery from '../components/IssueMediaGallery';
import usePolling from '../hooks/usePolling';
import { formatStatusLabel, getStatusBadgeTheme, normalizeStatus } from '../utils/issueStatus';

const ISSUE_LABELS = {
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  cleaning: 'Cleaning',
  carpentry: 'Carpentry',
  other: 'Other',
};

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

const getSpecialArrangements = (value) => {
  return [
    { key: 'specialAccess', label: 'Special access arrangements' },
    { key: 'petsInUnit', label: 'Pets in the unit' },
    { key: 'callBeforeArriving', label: 'Call before arriving' },
  ].filter((item) => Boolean(value?.[item.key]));
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
      
      // Show cost report form if task is being marked as completed
      if (nextStatus === 'completed') {
        // Small delay to ensure state is updated
        setTimeout(() => {
          setShowCostReportForm(true);
        }, 500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCostReportFormSuccess = async () => {
    await loadIssue();
  };

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
                    {String(issue.issueType || 'other')}-{String(issue.specificSpot || 'general area').toLowerCase()}
                  </h1>
                  <p className="text-xs text-[#7681A8] mt-1">
                    Reported {new Date(issue.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className={`inline-flex items-center justify-center min-w-[8.5rem] px-3.5 py-1 rounded-full whitespace-nowrap text-xs font-semibold ${getStatusBadgeTheme(issue.status, 'pill').className}`}>
                  {getStatusBadgeTheme(issue.status, 'pill').text}
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
                  <p className="font-medium">{getBuildingLabel(issue.building)}</p>
                  <p className="text-xs text-[#7B87AD]">{issue.building?.address ? `${issue.building.address}, ${issue.building.city || ''}`.trim() : ''}</p>
                  <p className="text-xs text-[#7B87AD]">Floor {issue.floor} • Unit {issue.unit}</p>
                  <p className="text-xs text-[#7B87AD]">Spot: {issue.specificSpot}</p>
                </div>
                <div className="sm:col-span-2 bg-[#F8F9FC] rounded-lg p-3">
                  <p className="text-[11px] text-[#7681A8] font-semibold">Report Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1 text-xs">
                    <div>
                      <p className="text-[#7B87AD]">Type</p>
                      <p className="font-medium text-[#2A2E3F]">{getIssueTypeLabel(issue.issueType)}</p>
                    </div>
                    <div>
                      <p className="text-[#7B87AD]">Urgency</p>
                      <p className="font-medium text-[#2A2E3F]">{getUrgencyLabel(issue.urgency)}</p>
                    </div>
                    <div>
                      <p className="text-[#7B87AD]">Priority</p>
                      <p className="font-medium capitalize text-[#2A2E3F]">{issue.priority || 'medium'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-[#F8F9FC] rounded-lg p-3">
                <p className="text-[11px] text-[#7681A8] font-semibold mb-1">Description</p>
                <p className="text-sm text-[#2A2E3F]">{issue.description || 'No description provided.'}</p>
              </div>

              <div className="mt-3 bg-[#F8F9FC] rounded-lg p-3">
                <p className="text-[11px] text-[#7681A8] font-semibold mb-2">Special Arrangements</p>
                {getSpecialArrangements(issue.specialArrangements).length > 0 ? (
                  <ul className="space-y-1 text-sm text-[#2A2E3F]">
                    {getSpecialArrangements(issue.specialArrangements).map((item) => (
                      <li key={item.key}>• {item.label}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[#7B87AD]">None selected</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E5E8F1] p-5 shadow-sm">
              <p className="text-sm font-semibold mb-3">Attachments</p>
              <IssueMediaGallery media={issue.media} />
            </div>

            <div className="flex flex-wrap gap-3">
              {normalizeStatus(issue.status) === 'assigned' || normalizeStatus(issue.status) === 'new' ? (
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => updateStatus('in progress')}
                  className="px-5 py-2.5 rounded-lg bg-[#3F46F0] text-white text-sm font-semibold disabled:opacity-70"
                >
                  {updating ? 'Updating...' : 'Start Work (In Progress)'}
                </button>
              ) : normalizeStatus(issue.status) === 'in progress' ? (
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => updateStatus('completed')}
                  className="px-5 py-2.5 rounded-lg bg-[#0E9F6E] text-white text-sm font-semibold disabled:opacity-70"
                >
                  {updating ? 'Updating...' : 'Mark as Completed'}
                </button>
              ) : null}
              
              {normalizeStatus(issue.status) === 'completed' && (
                <button
                  type="button"
                  onClick={() => navigate(`/staff/tasks/${id}/cost-report`)}
                  className="px-5 py-2.5 rounded-lg bg-[#F59E0B] text-white text-sm font-semibold hover:bg-[#D97706] transition"
                >
                  Create Cost Report
                </button>
              )}

              {normalizeStatus(issue.status) === 'cost report rejected' && (
                <button
                  type="button"
                  onClick={() => navigate(`/staff/tasks/${id}/cost-report`)}
                  className="px-5 py-2.5 rounded-lg bg-[#DC2626] text-white text-sm font-semibold hover:bg-[#B91C1C] transition"
                >
                  Review Rejected Cost Report
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
