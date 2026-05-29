import { useState } from 'react';
import { costReportAPI } from '../api';

const getBuildingLabel = (value) => {
  if (!value) return '—';
  if (typeof value === 'string') return value;
  return value.name || '—';
};

const getIssueUnit = (issue) => issue?.unit || issue?.unitNumber || '—';

export default function CostReportApproval({ costReport, issue, onApprovalComplete, onClose }) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const normalizedStatus = String(costReport?.status || '').toLowerCase();
  const isReviewable = !['approved', 'rejected'].includes(normalizedStatus);
  const isPendingReview = normalizedStatus === 'submitted';

  const handleApprove = async () => {
    setLoading(true);
    setError('');
    try {
      await costReportAPI.approve(costReport._id);
      if (onApprovalComplete) {
        onApprovalComplete('approved');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve cost report');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectRemarks.trim()) {
      setError('Please provide rejection remarks');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await costReportAPI.reject(costReport._id, { remarks: rejectRemarks });
      if (onApprovalComplete) {
        onApprovalComplete('rejected');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject cost report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Cost Report Review</h2>
            <p className="text-gray-600 mt-1">
              Submitted by {costReport.createdBy?.name} on {new Date(costReport.submittedAt).toLocaleDateString()}
            </p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              isPendingReview ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {isPendingReview ? 'Pending Review' : `Status: ${String(costReport?.status || 'Unknown').charAt(0).toUpperCase()}${String(costReport?.status || 'Unknown').slice(1)}`}
          </span>
        </div>
      </div>

      {!isReviewable && (
        <div className="px-6 pt-4">
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700">
            This cost report is no longer pending review. You can view the details below, but approval actions are disabled.
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Issue Information */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-3">Issue Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Issue Type</p>
              <p className="font-medium text-gray-800">{issue.issueType}</p>
            </div>
            <div>
              <p className="text-gray-600">Location</p>
              <p className="font-medium text-gray-800">{getBuildingLabel(issue.building)}, Unit {getIssueUnit(issue)}</p>
            </div>
            <div>
              <p className="text-gray-600">Specific Spot</p>
              <p className="font-medium text-gray-800">{issue.specificSpot}</p>
            </div>
            <div>
              <p className="text-gray-600">Priority</p>
              <p className="font-medium text-gray-800 capitalize">{issue.priority}</p>
            </div>
          </div>
        </div>

        {/* Cost Items */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Cost Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Item</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Category</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-700">Qty / Hrs</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-700">Unit Cost / Rate</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {costReport.costItems?.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-3 px-3">
                      <div>
                        <p className="font-medium text-gray-800">{item.itemName}</p>
                        {item.description && (
                          <p className="text-gray-600 text-xs mt-1">{item.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium capitalize">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">{item.category === 'labor' ? (item.hours || item.quantity || 0) : (item.quantity || 0)}</td>
                    <td className="py-3 px-3 text-right">LKR {(item.category === 'labor' ? item.rate : item.unitCost)?.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-medium">LKR {item.cost?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-3">Cost Breakdown</h3>
          <div className="space-y-2 text-sm mb-4">
            {costReport.costBreakdown?.laborCost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Labor:</span>
                <span className="font-medium">LKR {costReport.costBreakdown.laborCost.toFixed(2)}</span>
              </div>
            )}
            {costReport.costBreakdown?.materialsCost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Materials:</span>
                <span className="font-medium">LKR {costReport.costBreakdown.materialsCost.toFixed(2)}</span>
              </div>
            )}
            {costReport.costBreakdown?.transportCost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Transport:</span>
                <span className="font-medium">LKR {costReport.costBreakdown.transportCost.toFixed(2)}</span>
              </div>
            )}
            {costReport.costBreakdown?.otherCost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Other:</span>
                <span className="font-medium">LKR {costReport.costBreakdown.otherCost.toFixed(2)}</span>
              </div>
            )}
          </div>
          <div className="border-t border-gray-300 pt-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-800">Total Amount:</span>
              <span className="text-2xl font-bold text-blue-600">
                LKR {costReport.totalCost?.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {costReport.notes && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Notes</h3>
            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{costReport.notes}</p>
          </div>
        )}

        {/* Rejection Form */}
        {isReviewable && showRejectForm && (
          <div className="mb-6 p-4 border-2 border-red-300 rounded-lg bg-red-50">
            <h3 className="font-semibold text-gray-800 mb-3">Rejection Remarks</h3>
            <textarea
              value={rejectRemarks}
              onChange={(e) => setRejectRemarks(e.target.value)}
              placeholder="Please explain why this cost report is being rejected..."
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          {isReviewable ? (!showRejectForm ? (
            <>
              <button
                type="button"
                onClick={() => setShowRejectForm(true)}
                className="flex-1 px-4 py-2 border-2 border-red-600 text-red-600 rounded-lg font-medium hover:bg-red-50 transition"
                disabled={loading}
              >
                Reject
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Approve & Create Invoice'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                disabled={loading}
              >
                Close
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowRejectForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                disabled={loading}
              >
                Cancel Rejection
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50"
                disabled={loading || !rejectRemarks.trim()}
              >
                {loading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </>
          )) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Close
            </button>
          )}
        </div>

        {/* Previous Versions */}
        {costReport.previousVersions && costReport.previousVersions.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2">Submission History</h3>
            <div className="space-y-2 text-sm">
              {costReport.previousVersions.map((version, index) => (
                <p key={index} className="text-gray-600">
                  Revision {version.revisionNumber}: Submitted on {new Date(version.submittedAt).toLocaleString()}
                  {version.rejectionRemarks && (
                    <span className="text-red-600 ml-2">(Rejected: {version.rejectionRemarks})</span>
                  )}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
