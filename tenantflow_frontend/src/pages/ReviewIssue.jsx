import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const URGENCY_LABELS = {
  urgent: { label: 'High Priority', tag: 'URGENT', color: 'text-orange-600 bg-orange-50 border-orange-200' },
  standard: { label: 'Standard Priority', tag: 'STANDARD', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  low: { label: 'Low Priority', tag: 'LOW', color: 'text-green-600 bg-green-50 border-green-200' },
};

const STORAGE_KEY = 'tenantflow_report_issue';

export default function ReviewIssue() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem('role');
  const [showSuccess, setShowSuccess] = useState(false);
  const [mediaPreviews, setMediaPreviews] = useState([]);

  useEffect(() => {
    if (role !== 'tenant') {
      navigate('/login');
    }
  }, [role, navigate]);

  useEffect(() => {
    const files = (location.state && location.state.mediaFiles) || [];
    if (!Array.isArray(files) || files.length === 0) {
      setMediaPreviews([]);
      return;
    }

    const nextPreviews = files.map((file) => ({
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file),
    }));

    setMediaPreviews(nextPreviews);

    return () => {
      nextPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [location.state]);

  const storedReport = useMemo(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return null;
    }

    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }, []);

  const reportData = useMemo(() => {
    const state = location.state || storedReport || {};
    const urgencyInfo = URGENCY_LABELS[state.urgency] || URGENCY_LABELS.standard;
    const mediaMeta = Array.isArray(state.mediaMeta) ? state.mediaMeta : [];
    const mediaCount = mediaMeta.length || (Number.isFinite(state.mediaCount) ? state.mediaCount : 0);

    return {
      category: state.category || 'Plumbing',
      urgency: urgencyInfo,
      location: [state.building, state.unit, state.specificSpot].filter(Boolean).join(', ') || 'Building A, Apt 402, Master Bathroom',
      description:
        state.description ||
        'The sink faucet is dripping continuously, and the water pressure seems lower than usual. There is also a small pool of water forming inside the cabinet below.',
      mediaCount,
      mediaMeta,
      mediaPreviews,
    };
  }, [location.state, mediaPreviews, storedReport]);

  const handleSubmit = () => {
    setShowSuccess(true);
  };

  const handleGoDashboard = () => {
    localStorage.removeItem(STORAGE_KEY);
    navigate('/tenant-dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">TF</span>
            </div>
            <span className="text-lg font-bold text-gray-900">Tenant Flow</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <span className="text-slate-800 font-semibold">Dashboard</span>
            <span>My Requests</span>
            <span>Profile</span>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition" type="button">
              <span className="text-xs font-semibold text-slate-600">N</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-2 py-1.5 rounded-lg transition"
            >
              <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-[10px]">
                S
              </div>
              <span className="text-[11px] font-medium text-gray-700">Sumi</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-xs text-slate-500 flex items-center gap-2 mb-2"
        >
          <span className="text-sm">&lt;-</span>
          Back to Report Issue
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Review Your Report</h1>
        <p className="text-xs text-slate-500 mt-1">Step 2 of 2: Confirm Details</p>

        <div className="mt-3 flex items-center gap-2">
          <div className="h-2 w-10 bg-blue-200 rounded-full"></div>
          <div className="h-2 w-10 bg-blue-600 rounded-full"></div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm mt-5">
          <div className="divide-y divide-slate-100">
            <div className="px-6 py-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-sm font-bold">
                C
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">{reportData.category}</div>
                <div className="text-xs text-slate-500">Issue Category</div>
              </div>
            </div>

            <div className="px-6 py-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 text-sm font-bold">
                !
              </div>
              <div className="flex items-center gap-2">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{reportData.urgency.label}</div>
                  <div className="text-xs text-slate-500">Urgency Level</div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${reportData.urgency.color}`}>
                  {reportData.urgency.tag}
                </span>
              </div>
            </div>

            <div className="px-6 py-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 text-sm font-bold">
                L
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">{reportData.location}</div>
                <div className="text-xs text-slate-500">Location</div>
              </div>
            </div>

            <div className="px-6 py-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 text-sm font-bold">
                D
              </div>
              <div>
                <div className="text-sm text-slate-700 leading-relaxed max-w-xl">
                  {reportData.description}
                </div>
                <div className="text-xs text-slate-500 mt-1">Description</div>
              </div>
            </div>

            <div className="px-6 py-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 text-sm font-bold">
                M
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">Attached Media</div>
                <div className="text-xs text-slate-500">{reportData.mediaCount} files selected</div>
                {reportData.mediaPreviews.length > 0 ? (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {reportData.mediaPreviews.map((preview) => (
                      <div
                        key={preview.url}
                        className="w-16 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden"
                      >
                        {preview.type && preview.type.startsWith('image') ? (
                          <img src={preview.url} alt={preview.name} className="w-full h-full object-cover" />
                        ) : (
                          <video src={preview.url} className="w-full h-full object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : reportData.mediaMeta.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {reportData.mediaMeta.map((media) => (
                      <span
                        key={`${media.name}-${media.type}`}
                        className="text-[10px] text-slate-600 border border-slate-200 rounded-full px-2 py-0.5"
                      >
                        {media.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-slate-400">No media attached.</div>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 py-4">
            <div className="bg-blue-50 border border-blue-100 text-blue-700 text-xs rounded-lg px-4 py-3">
              By submitting, you agree to allow maintenance staff access to your unit as per your lease agreement.
              <div className="mt-2 text-[11px] text-blue-700">
                Estimated Response: <span className="font-semibold">Within 24 Hours</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-5">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg"
              >
                Submit Request &gt;
              </button>
            </div>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-500 mt-5">
          Need immediate assistance? <span className="text-blue-600 font-semibold">Call Emergency Maintenance</span>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-[360px] px-6 py-7 text-center">
            <div className="w-14 h-14 rounded-full border-4 border-emerald-100 bg-emerald-50 flex items-center justify-center mx-auto">
              <span className="text-emerald-600 text-lg font-bold">OK</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-4">Request Submitted Successfully!</h2>
            <p className="text-xs text-slate-500 mt-2">
              Your request has been logged and assigned to our maintenance team.
            </p>
            <button
              type="button"
              onClick={handleGoDashboard}
              className="mt-5 w-full px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
