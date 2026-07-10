import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { costReportAPI } from '../api';
import usePolling from '../hooks/usePolling';

const getBuildingLabel = (value) => {
  if (!value) return '—';
  if (typeof value === 'string') return value;
  return value.name || '—';
};

const getIssueUnit = (issue) => issue?.unit || issue?.unitNumber || '—';

const statusStyles = {
  submitted: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

const statusLabel = {
  submitted: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected'
};

export default function CostReportsDashboard() {
  const navigate = useNavigate();
  const [costReports, setCostReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCostReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await costReportAPI.getPendingForManager();
      setCostReports(response.data.costReports || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load cost reports');
      console.error('Error loading cost reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  usePolling(loadCostReports, 5000, true);

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-gray-600">Loading cost reports...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span>📋</span> Cost Report Review History
          </h2>
          <p className="text-xs text-gray-500 mt-1">Submitted, approved, and rejected reports stay visible here</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {costReports.length === 0 ? (
        <div className="p-6 text-center border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-sm font-medium text-gray-500">No cost reports yet</p>
          <p className="text-xs text-gray-400 mt-1">Submitted, approved, and rejected reports will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {costReports.map((report) => (
            <div
              key={report._id}
              className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition p-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {report.issue.issueType} - {getBuildingLabel(report.issue.building)}, Unit {getIssueUnit(report.issue)}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusStyles[report.status] || 'bg-gray-100 text-gray-700'}`}>
                      {statusLabel[report.status] || report.status || 'Unknown'}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mb-2">
                    Submitted by <strong>{report.createdBy?.name}</strong> on{' '}
                    {new Date(report.submittedAt || report.createdAt).toLocaleDateString()}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div>
                      <p className="text-[11px] text-gray-500">Labor Cost</p>
                      <p className="text-sm font-semibold text-gray-800">
                        LKR {report.costBreakdown?.laborCost?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500">Materials</p>
                      <p className="text-sm font-semibold text-gray-800">
                        LKR {report.costBreakdown?.materialsCost?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500">Transport</p>
                      <p className="text-sm font-semibold text-gray-800">
                        LKR {report.costBreakdown?.transportCost?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2">
                      <p className="text-[11px] text-blue-600">Total Cost</p>
                      <p className="font-bold text-blue-700 text-sm">
                        LKR {report.totalCost?.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {report.notes && (
                    <div className="mb-2">
                      <p className="text-[11px] text-gray-500">Notes:</p>
                      <p className="text-xs text-gray-700">{report.notes}</p>
                    </div>
                  )}

                  {report.revisionNumber && report.revisionNumber > 1 && (
                    <p className="text-[11px] text-orange-600 mb-2">
                      ⚠️ Revision {report.revisionNumber} (previously rejected and resubmitted)
                    </p>
                  )}

                  {report.status === 'rejected' && report.rejectionRemarks && (
                    <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wide">Rejected remarks</p>
                      <p className="text-xs text-red-800 mt-1">{report.rejectionRemarks}</p>
                    </div>
                  )}

                  {report.status === 'approved' && report.approvedBy?.name && (
                    <p className="text-[11px] text-green-700 mt-2">Approved by {report.approvedBy.name}</p>
                  )}
                </div>

                <div className="ml-4 flex flex-col gap-2 items-stretch">
                  {report.status === 'submitted' ? (
                    <button
                      onClick={() => navigate(`/admin/cost-reports/${report._id}`)}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition whitespace-nowrap"
                    >
                      View & Review
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/admin/cost-reports/${report._id}`)}
                      className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition whitespace-nowrap"
                    >
                      View Details
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
