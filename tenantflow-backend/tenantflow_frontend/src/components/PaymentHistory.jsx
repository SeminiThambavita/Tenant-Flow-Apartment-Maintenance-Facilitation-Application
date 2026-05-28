import { useEffect, useState } from 'react';
import { paymentAPI } from '../api';

export default function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await paymentAPI.getAll();
      setPayments(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payment history');
      console.error('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = (payment) => {
    // This would generate a PDF receipt
    console.log('Downloading receipt for payment:', payment._id);
    // Implementation would involve generating a PDF or downloading from server
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Loading payment history...</p>
      </div>
    );
  }

  if (showReceipt && selectedPayment) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full p-8">
          {/* Receipt */}
          <div className="mb-6">
            <div className="text-center mb-6 pb-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Payment Receipt</h2>
              <p className="text-gray-600 mt-1">Receipt #{selectedPayment.referenceNumber || selectedPayment._id}</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Payment Date</p>
                  <p className="text-gray-800 font-medium">{new Date(selectedPayment.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Payment Method</p>
                  <p className="text-gray-800 font-medium capitalize">{selectedPayment.method || 'PayHere'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Invoice Number</p>
                  <p className="text-gray-800 font-medium">{selectedPayment.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Status</p>
                  <p className="text-green-600 font-medium flex items-center gap-1">
                    <span>✓</span> {selectedPayment.status === 'success' ? 'Completed' : selectedPayment.status}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-700 font-medium">Amount Paid</span>
                <span className="text-3xl font-bold text-green-600">LKR {selectedPayment.amount.toFixed(2)}</span>
              </div>
              {selectedPayment.processingFee && (
                <div className="text-sm text-gray-600">
                  Processing Fee: LKR {selectedPayment.processingFee.toFixed(2)}
                </div>
              )}
            </div>

            {selectedPayment.description && (
              <div className="mb-6">
                <p className="text-xs text-gray-600 font-semibold mb-2">Description</p>
                <p className="text-gray-800">{selectedPayment.description}</p>
              </div>
            )}

            {selectedPayment.transactionId && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-600 font-semibold mb-1">Transaction ID</p>
                <p className="text-blue-800 font-mono text-sm">{selectedPayment.transactionId}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => downloadReceipt(selectedPayment)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              📥 Download Receipt
            </button>
            <button
              onClick={() => setShowReceipt(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Payment History</h2>
        <p className="text-gray-600 mt-1">View all your payment transactions and receipts</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {payments.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 text-lg">No payments yet</p>
          <p className="text-gray-400 text-sm mt-2">Your payment history will appear here once you make a payment</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {payments.map((payment) => (
            <div
              key={payment._id}
              className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {payment.description || 'Payment for Invoice'}
                    </h3>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                      ✓ Completed
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-600">Payment Date</p>
                      <p className="font-medium text-gray-800">{new Date(payment.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Amount Paid</p>
                      <p className="font-bold text-green-600">LKR {payment.amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Method</p>
                      <p className="font-medium text-gray-800 capitalize">{payment.method || 'PayHere'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Transaction ID</p>
                      <p className="font-mono text-gray-800 text-sm">{payment.transactionId?.slice(-8) || 'N/A'}</p>
                    </div>
                  </div>

                  {payment.processingFee > 0 && (
                    <p className="text-xs text-gray-600">
                      Processing Fee: LKR {payment.processingFee.toFixed(2)}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSelectedPayment(payment);
                    setShowReceipt(true);
                  }}
                  className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition whitespace-nowrap"
                >
                  View Receipt
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
