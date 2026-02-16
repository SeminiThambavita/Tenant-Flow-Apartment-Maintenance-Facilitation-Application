import { Link } from 'react-router-dom';

export default function PaymentCancel() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-amber-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl shadow-lg border border-amber-100 p-8 max-w-md w-full text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xl">
          !
        </div>
        <h1 className="mt-4 text-xl font-['Space_Grotesk'] font-semibold text-slate-900">Payment Canceled</h1>
        <p className="mt-2 text-sm text-slate-500">No charges were made. You can try again anytime.</p>
        <Link
          to="/payment"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2"
        >
          Return to Payment
        </Link>
      </div>
    </div>
  );
}
