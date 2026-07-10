import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAPI, invoiceAPI, paymentAPI } from '../api';
import Logo from '../components/Logo';

const tipOptions = [10, 15, 20];

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const [invoice, setInvoice] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(true);
  const [invoiceError, setInvoiceError] = useState('');
  const [tipPercent, setTipPercent] = useState(10);
  const [customTip, setCustomTip] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tenantProfile, setTenantProfile] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadTenantProfile = async () => {
      try {
        const response = await authAPI.getProfile();
        if (isMounted) {
          setTenantProfile(response?.data?.user || null);
        }
      } catch {
        if (isMounted) {
          setTenantProfile(null);
        }
      }
    };

    loadTenantProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadInvoice = async () => {
      const stateInvoice = location.state?.invoice;
      if (stateInvoice?._id) {
        if (isMounted) {
          setInvoice(stateInvoice);
          setInvoiceError('');
          setInvoiceLoading(false);
        }
        return;
      }

      const pendingInvoiceId = localStorage.getItem('pendingInvoiceId');
      if (!pendingInvoiceId) {
        if (isMounted) {
          setInvoice(null);
          setInvoiceError('');
          setInvoiceLoading(false);
        }
        return;
      }

      if (isMounted) {
        setInvoiceLoading(true);
      }

      try {
        const response = await invoiceAPI.getById(pendingInvoiceId);
        if (isMounted) {
          setInvoice(response?.data?.invoice || null);
          setInvoiceError('');
        }
      } catch (err) {
        if (isMounted) {
          setInvoice(null);
          setInvoiceError(err?.response?.data?.message || 'Failed to load invoice details.');
        }
      } finally {
        if (isMounted) {
          setInvoiceLoading(false);
        }
      }
    };

    loadInvoice();

    return () => {
      isMounted = false;
    };
  }, [location.state]);

  const invoiceBreakdown = useMemo(() => {
    if (!invoice) {
      return [];
    }

    const costBreakdown = invoice.costBreakdown || {};
    const partsCharge = Number(
      invoice.partsCharge ??
        (costBreakdown.materialsCost || 0) +
          (costBreakdown.transportCost || 0) +
          (costBreakdown.otherCost || 0)
    );
    const entries = [
      { label: 'Labor Charges', amount: Number(invoice.laborCharge ?? costBreakdown.laborCost ?? 0) },
      { label: 'Parts / Materials', amount: partsCharge }
    ].filter((entry) => Number(entry.amount || 0) > 0);

    if (entries.length > 0) {
      return entries;
    }

    return [{ label: 'Invoice Total', amount: Number(invoice.total ?? 0) }];
  }, [invoice]);

  const serviceAmount = Number(
    invoice?.total ?? invoiceBreakdown.reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
  );

  const payhereItems = invoice?.issueTitle
    ? `${invoice.issueTitle}${invoice.invoiceNumber ? ` (${invoice.invoiceNumber})` : ''}`
    : 'Maintenance Payment';

  const subtotal = serviceAmount;

  const tipAmount = useMemo(() => {
    if (tipPercent === 'custom') {
      const parsed = Number(customTip);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return Number((subtotal * (tipPercent / 100)).toFixed(2));
  }, [tipPercent, customTip, subtotal]);

  const totalDue = Number((subtotal + tipAmount).toFixed(2));

  const submitToPayHere = (endpoint, payload) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = endpoint;

    Object.entries(payload).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  const handlePayNow = async () => {
    setError('');

    if (!invoice?._id) {
      setError('Select an invoice before paying.');
      return;
    }

    if (!termsAccepted) {
      setError('Please agree to the terms before paying.');
      return;
    }

    localStorage.setItem('pendingInvoiceId', invoice._id);

    const invoiceLabel = invoice?.issueTitle
      ? `${invoice.issueTitle}${invoice.invoiceNumber ? ` (${invoice.invoiceNumber})` : ''}`
      : 'Maintenance Payment';
    localStorage.setItem('pendingInvoiceLabel', invoiceLabel);

    setIsSubmitting(true);

    try {
      const response = await paymentAPI.initiate({
        amount: totalDue,
        items: payhereItems,
        invoiceId: invoice._id
      });

      const payhere = response?.data?.payhere;
      if (!payhere?.endpoint || !payhere?.payload) {
        setError('Payment gateway response missing. Please try again.');
        return;
      }

      submitToPayHere(payhere.endpoint, payhere.payload);
    } catch (err) {
      setError(err?.response?.data?.message || 'Payment initiation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (invoiceLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50 font-['DM_Sans'] flex items-center justify-center px-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm text-sm text-slate-600">
          Loading invoice details...
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50 font-['DM_Sans']">
        <div className="absolute -top-24 left-10 h-64 w-64 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute top-32 right-10 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" />

        <div className="relative max-w-3xl mx-auto px-6 py-16">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <Logo size={24} textClassName="text-xs font-semibold text-slate-600" />
            <h1 className="mt-4 text-2xl font-['Space_Grotesk'] font-semibold text-slate-900">No invoice selected</h1>
            <p className="mt-2 text-sm text-slate-500">Open an invoice from the invoices page or the dashboard quick actions to continue with PayHere sandbox.</p>
            {invoiceError && <p className="mt-3 text-sm text-red-600">{invoiceError}</p>}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => navigate('/invoices')}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-3 transition"
              >
                Go to Invoices
              </button>
              <button
                type="button"
                onClick={() => navigate('/tenant-dashboard')}
                className="rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-semibold px-5 py-3 transition hover:bg-slate-50"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50 font-['DM_Sans']">
      <div className="absolute -top-24 left-10 h-64 w-64 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="absolute top-32 right-10 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Logo size={24} textClassName="text-xs font-semibold text-slate-600" />
            <h1 className="text-2xl font-['Space_Grotesk'] font-semibold text-slate-900">Payment for Maintenance</h1>
            <p className="text-sm text-slate-500">Review your invoice details and pay securely</p>
            <span className="inline-flex mt-3 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
              PayHere Sandbox
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/tenant-dashboard')}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6">
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Invoice Number</p>
                  <p className="text-sm font-semibold text-slate-900">{invoice.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Date Issued</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {new Date(invoice.issuedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Issue</p>
                  <p className="text-sm font-semibold text-slate-900">{invoice.issueTitle}</p>
                </div>
                <span className="text-xs font-semibold text-amber-700 bg-amber-100 border border-amber-200 px-3 py-1 rounded-full">
                  Payment Pending
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <h2 className="text-sm font-['Space_Grotesk'] font-semibold text-slate-900">Cost Breakdown</h2>
              <div className="mt-4 space-y-3 text-sm">
                {invoiceBreakdown.map((entry) => (
                  <div key={entry.label} className="flex justify-between text-slate-600">
                    <span>{entry.label}</span>
                    <span>LKR {Number(entry.amount || 0).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-dashed border-slate-200 pt-3 flex justify-between font-semibold text-slate-900">
                  <span>Subtotal</span>
                  <span>LKR {subtotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">Tip your technician</p>
                    <p className="text-[11px] text-slate-400">100% of tips go directly to the staff</p>
                  </div>
                  <span className="text-xs font-semibold text-blue-600">LKR {tipAmount.toFixed(2)}</span>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2">
                  {tipOptions.map((percent) => (
                    <button
                      key={percent}
                      type="button"
                      onClick={() => setTipPercent(percent)}
                      className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                        tipPercent === percent
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:border-blue-200'
                      }`}
                    >
                      {percent}%
                      <span className="block text-[10px] text-slate-400">LKR {(subtotal * (percent / 100)).toFixed(2)}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setTipPercent('custom')}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                      tipPercent === 'custom'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:border-blue-200'
                    }`}
                  >
                    Custom
                    <span className="block text-[10px] text-slate-400">Any</span>
                  </button>
                </div>

                {tipPercent === 'custom' && (
                  <div className="mt-3">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={customTip}
                      onChange={(event) => setCustomTip(event.target.value)}
                      placeholder="Enter custom tip"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-end justify-between">
                <div className="text-xs text-slate-500">
                  <p>Service: LKR {subtotal.toFixed(2)}</p>
                  <p>Tip: LKR {tipAmount.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Total Due</p>
                  <p className="text-xl font-['Space_Grotesk'] font-semibold text-slate-900">LKR {totalDue.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 h-fit">
            <h2 className="text-sm font-['Space_Grotesk'] font-semibold text-slate-900">Payment Details</h2>
            <p className="text-xs text-slate-400 mt-1">Tenant details are matched automatically from your account.</p>

            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 space-y-1">
                <p><span className="font-semibold">Name:</span> {tenantProfile?.name || 'Tenant'}</p>
                <p><span className="font-semibold">Email:</span> {tenantProfile?.email || '-'}</p>
                <p><span className="font-semibold">Phone:</span> {tenantProfile?.phone || '-'}</p>
                <p><span className="font-semibold">Unit:</span> {tenantProfile?.unitNumber || tenantProfile?.apartmentNumber || '-'}</p>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(event) => setTermsAccepted(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                I agree to the payment terms and authorize this charge.
              </label>

              {error && <p className="text-xs text-red-600">{error}</p>}

              <button
                type="button"
                onClick={handlePayNow}
                disabled={isSubmitting}
                className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-3 transition disabled:opacity-70"
              >
                {isSubmitting ? 'Preparing Payment...' : `Pay LKR ${totalDue.toFixed(2)} Now`}
              </button>
              <button
                type="button"
                onClick={() => navigate('/tenant-dashboard')}
                className="w-full text-xs text-slate-400 hover:text-slate-600"
              >
                Cancel Payment
              </button>

              <div className="mt-4 flex items-center justify-between text-[10px] text-slate-400">
                <span>PayHere Secure</span>
                <span>SSL Encrypted</span>
                <span>PCI DSS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
