import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { issueAPI, costReportAPI } from '../api';
import StaffNav from '../components/StaffNav';
import IssueMediaGallery from '../components/IssueMediaGallery';
import CostReportForm from '../components/CostReportForm';
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
  const [showCostReportForm, setShowCostReportForm] = useState(false);
  const [costReport, setCostReport] = useState(null);
  const [loadingCostReport, setLoadingCostReport] = useState(false);

  const loadIssue = useCallback(async () => {
    if (!id || role !== 'staff') return;
    try {
      const response = await issueAPI.getById(id);
      setIssue(response?.data?.issue || null);
      
      // Load cost report if it exists
      if (response?.data?.issue?.currentCostReport) {
        try {
          const costReportResp = await costReportAPI.getById(response.data.issue.currentCostReport);
          setCostReport(costReportResp?.data?.costReport || null);
        } catch (err) {
          console.error('Error loading cost report:', err);
        }
      }
      
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
    // Reload issue to get updated cost report
    await loadIssue();
    setShowCostReportForm(false);
    alert('Cost report saved. You can now submit it for approval.');
  };

  const handleSubmitCostReport = async () => {
    if (!costReport?._id) {
      setError('No cost report found');
      return;
    }

    setUpdating(true);
    setError('');
    try {
      await costReportAPI.submit(costReport._id);
      // Reload to get updated status
      await loadIssue();
      alert('Cost report submitted for approval!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit cost report.');
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
                  onClick={() => setShowCostReportForm(true)}
                  className="px-5 py-2.5 rounded-lg bg-[#F59E0B] text-white text-sm font-semibold hover:bg-[#D97706] transition"
                >
                  {costReport ? 'Edit Cost Report' : 'Create Cost Report'}
                </button>
              )}

              {costReport && normalizeStatus(costReport.status) === 'draft' && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={handleSubmitCostReport}
                  className="px-5 py-2.5 rounded-lg bg-[#10B981] text-white text-sm font-semibold disabled:opacity-70 hover:bg-[#059669] transition"
                >
                  {updating ? 'Submitting...' : 'Submit Cost Report'}
                </button>
              )}

              {costReport && normalizeStatus(costReport.status) === 'rejected' && (
                <div className="text-sm">
                  <p className="text-red-600 font-medium mb-2">Cost Report Rejected</p>
                  <p className="text-gray-600">Remarks: {costReport.rejectionRemarks}</p>
                </div>
              )}

              {costReport && normalizeStatus(costReport.status) === 'submitted' && (
                <div className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm font-medium">Cost report submitted for approval</p>
                </div>
              )}

              {costReport && normalizeStatus(costReport.status) === 'approved' && (
                <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-sm font-medium">Cost report approved ✓</p>
                </div>
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

      {/* Cost Report Form Modal */}
      {showCostReportForm && issue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CostReportForm
              issue={issue}
              costReportId={costReport?._id}
              onSubmitSuccess={handleCostReportFormSuccess}
              onCancel={() => setShowCostReportForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
