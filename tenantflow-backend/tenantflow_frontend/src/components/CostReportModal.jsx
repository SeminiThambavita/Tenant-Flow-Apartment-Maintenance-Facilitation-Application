import { useState } from 'react';

export default function CostReportModal({ issue, onClose, onSubmit }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    laborCost: '',
    materialsCost: '',
    otherCost: '',
    notes: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that at least one cost field is filled
    if (!formData.laborCost && !formData.materialsCost && !formData.otherCost) {
      alert('Please enter at least one cost item');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting cost report:', error);
      alert('Failed to submit cost report');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const labor = parseFloat(formData.laborCost) || 0;
    const materials = parseFloat(formData.materialsCost) || 0;
    const other = parseFloat(formData.otherCost) || 0;
    return (labor + materials + other).toFixed(2);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Cost Report Required</h2>
          <p className="text-gray-600 mt-2">
            Please create a cost report for the completed task before final submission.
          </p>
        </div>

        {/* Task Info */}
        {issue && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Issue Type</p>
                <p className="font-semibold text-gray-800">{issue.issueType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-semibold text-gray-800">
                  {issue.building}, Unit {issue.unitNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Specific Spot</p>
                <p className="font-semibold text-gray-800">{issue.specificSpot}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Priority</p>
                <p className="font-semibold text-gray-800 capitalize">{issue.priority}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Work Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe the work performed..."
              required
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Cost Breakdown */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Labor Cost (Rs.)
              </label>
              <input
                type="number"
                name="laborCost"
                value={formData.laborCost}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Materials Cost (Rs.)
              </label>
              <input
                type="number"
                name="materialsCost"
                value={formData.materialsCost}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Other Cost (Rs.)
              </label>
              <input
                type="number"
                name="otherCost"
                value={formData.otherCost}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Total */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Total Cost:</span>
              <span className="text-2xl font-bold text-blue-600">Rs. {calculateTotal()}</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Any additional information about the work..."
              rows="2"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Cost Report'}
            </button>
          </div>
        </form>

        {/* Info Note */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> The cost report is required before the task can proceed to payment. Please ensure all costs are accurate.
          </p>
        </div>
      </div>
    </div>
  );
}
