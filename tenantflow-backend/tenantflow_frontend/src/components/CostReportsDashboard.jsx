import { useEffect, useState } from 'react';
import { costReportAPI } from '../api';
import CostReportApproval from './CostReportApproval';

export default function CostReportsDashboard() {
  const [costReports, setCostReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  useEffect(() => {
    loadCostReports();
  }, []);

  const loadCostReports = async () => {
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
  };

  const handleApprovalComplete = (action) => {
    setShowApprovalModal(false);
    // Reload cost reports list
    loadCostReports();
  };

  const openApprovalModal = (report) => {
    setSelectedReport(report);
    setShowApprovalModal(true);
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Loading cost reports...</p>
      </div>
    );
  }

  if (showApprovalModal && selectedReport) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <CostReportApproval
            costReport={selectedReport}
            issue={selectedReport.issue}
            onApprovalComplete={handleApprovalComplete}
            onClose={() => setShowApprovalModal(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Cost Reports for Approval</h2>
        <p className="text-gray-600 mt-1">Review and approve/reject cost reports from staff members</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {costReports.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 text-lg">No pending cost reports</p>
          <p className="text-gray-400 text-sm mt-2">All submitted cost reports have been reviewed</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {costReports.map((report) => (
            <div
              key={report._id}
              className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {report.issue.issueType} - {report.issue.building}, Unit {report.issue.unitNumber}
                    </h3>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                      Pending Review
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">
                    Submitted by <strong>{report.createdBy?.name}</strong> on{' '}
                    {new Date(report.submittedAt).toLocaleDateString()}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-600">Labor Cost</p>
                      <p className="font-semibold text-gray-800">
                        LKR {report.costBreakdown?.laborCost?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Materials</p>
                      <p className="font-semibold text-gray-800">
                        LKR {report.costBreakdown?.materialsCost?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Transport</p>
                      <p className="font-semibold text-gray-800">
                        LKR {report.costBreakdown?.transportCost?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2">
                      <p className="text-xs text-blue-600">Total Cost</p>
                      <p className="font-bold text-blue-700 text-lg">
                        LKR {report.totalCost?.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {report.notes && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-600">Notes:</p>
                      <p className="text-sm text-gray-700">{report.notes}</p>
                    </div>
                  )}

                  {report.revisionNumber && report.revisionNumber > 1 && (
                    <p className="text-xs text-orange-600 mb-2">
                      ⚠️ Revision {report.revisionNumber} (previously rejected and resubmitted)
                    </p>
                  )}
                </div>

                <button
                  onClick={() => openApprovalModal(report)}
                  className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition whitespace-nowrap"
                >
                  Review & Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
