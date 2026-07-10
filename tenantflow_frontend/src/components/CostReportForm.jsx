import { useState, useCallback } from 'react';
import { costReportAPI } from '../api';

const COST_CATEGORIES = [
  { value: 'labor', label: 'Labor' },
  { value: 'materials', label: 'Materials' },
  { value: 'transport', label: 'Transport' },
  { value: 'other', label: 'Other' }
];

export default function CostReportForm({ issue, costReportId, onSubmitSuccess, onCancel }) {
  const [costItems, setCostItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Add a new cost item
  const addCostItem = useCallback(() => {
    setCostItems([...costItems, {
      itemName: '',
      description: '',
      quantity: 1,
      unitCost: 0,
      cost: 0,
      category: 'other'
    }]);
  }, [costItems]);

  // Update cost item
  const updateCostItem = (index, field, value) => {
    const updated = [...costItems];
    updated[index][field] = value;

    // Auto-calculate cost
    if (field === 'quantity' || field === 'unitCost') {
      updated[index].cost = (updated[index].quantity || 1) * (updated[index].unitCost || 0);
    }

    setCostItems(updated);
  };

  // Remove cost item
  const removeCostItem = (index) => {
    setCostItems(costItems.filter((_, i) => i !== index));
  };

  // Calculate totals by category
  const calculateBreakdown = () => {
    const breakdown = {
      laborCost: 0,
      materialsCost: 0,
      transportCost: 0,
      otherCost: 0
    };

    costItems.forEach(item => {
      const category = item.category || 'other';
      const key = category + 'Cost';
      if (breakdown[key] !== undefined) {
        breakdown[key] += item.cost || 0;
      }
    });

    return breakdown;
  };

  const calculateTotal = () => {
    return costItems.reduce((sum, item) => sum + (item.cost || 0), 0);
  };

  const breakdown = calculateBreakdown();
  const totalCost = calculateTotal();

  // Submit cost report
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate
    if (costItems.length === 0) {
      setError('Please add at least one cost item');
      return;
    }

    if (costItems.some(item => !item.itemName || item.unitCost <= 0)) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      if (costReportId) {
        // Update existing cost report
        await costReportAPI.update(costReportId, {
          costItems,
          notes
        });
      } else {
        // Create new cost report
        const createResp = await costReportAPI.create({ issueId: issue._id });
        const newReportId = createResp.data.costReport._id;

        // Update with items
        await costReportAPI.update(newReportId, {
          costItems,
          notes
        });
      }

      // Show success and call callback
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save cost report');
      console.error('Cost report error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800">Cost Report</h2>
        <p className="text-gray-600 mt-1">
          {issue.issueType} - {issue.building}, Unit {issue.unitNumber}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Cost Items Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Cost Items</h3>
            <button
              type="button"
              onClick={addCostItem}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              + Add Item
            </button>
          </div>

          {costItems.length === 0 ? (
            <div className="p-6 text-center border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500">No cost items added yet. Click "Add Item" to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {costItems.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Item Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Item Name *
                      </label>
                      <input
                        type="text"
                        value={item.itemName}
                        onChange={(e) => updateCostItem(index, 'itemName', e.target.value)}
                        placeholder="e.g., Pipe Replacement"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={item.category}
                        onChange={(e) => updateCostItem(index, 'category', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {COST_CATEGORIES.map(cat => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={item.description}
                      onChange={(e) => updateCostItem(index, 'description', e.target.value)}
                      placeholder="Additional details about this item..."
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Quantity, Unit Cost, Total */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateCostItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Cost (LKR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitCost}
                        onChange={(e) => updateCostItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total (LKR)
                      </label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                        <p className="font-semibold text-gray-800">
                          {(item.cost || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeCostItem(index)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove Item
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cost Summary */}
        {costItems.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3">Cost Breakdown</h3>
            <div className="space-y-2 text-sm mb-4">
              {breakdown.laborCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Labor Cost:</span>
                  <span className="font-medium">LKR {breakdown.laborCost.toFixed(2)}</span>
                </div>
              )}
              {breakdown.materialsCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Materials Cost:</span>
                  <span className="font-medium">LKR {breakdown.materialsCost.toFixed(2)}</span>
                </div>
              )}
              {breakdown.transportCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Transport Cost:</span>
                  <span className="font-medium">LKR {breakdown.transportCost.toFixed(2)}</span>
                </div>
              )}
              {breakdown.otherCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Other Cost:</span>
                  <span className="font-medium">LKR {breakdown.otherCost.toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className="border-t border-gray-300 pt-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-800">Total Cost:</span>
                <span className="text-2xl font-bold text-blue-600">LKR {totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional information about the cost report..."
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
            disabled={loading || costItems.length === 0}
          >
            {loading ? 'Saving...' : 'Save & Continue'}
          </button>
        </div>
      </form>
    </div>
  );
}
