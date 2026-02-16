import { Link } from 'react-router-dom';

export default function PaymentSuccess() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-blue-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-8 max-w-md w-full text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl">
          ✓
        </div>
        <h1 className="mt-4 text-xl font-['Space_Grotesk'] font-semibold text-slate-900">Payment Successful</h1>
        <p className="mt-2 text-sm text-slate-500">Your payment has been completed. Thank you!</p>
        <Link
          to="/tenant-dashboard"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
