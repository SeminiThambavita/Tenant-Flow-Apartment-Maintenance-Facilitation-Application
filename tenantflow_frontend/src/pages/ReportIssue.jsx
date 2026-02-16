import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'tenantflow_report_issue';

export default function ReportIssue() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const [urgency, setUrgency] = useState('standard');
  const [category, setCategory] = useState('');
  const [specificSpot, setSpecificSpot] = useState('');
  const [description, setDescription] = useState('');
  const [building, setBuilding] = useState('Building A');
  const [unit, setUnit] = useState('Apt 402');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [mediaMeta, setMediaMeta] = useState([]);
  const [errors, setErrors] = useState({});
  const maxDescriptionLength = 500;

  useEffect(() => {
    if (role !== 'tenant') {
      navigate('/login');
    }
  }, [role, navigate]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return;
    }

    try {
      const data = JSON.parse(saved);
      setCategory(data.category || '');
      setUrgency(data.urgency || 'standard');
      setSpecificSpot(data.specificSpot || '');
      setDescription(data.description || '');
      setBuilding(data.building || 'Building A');
      setUnit(data.unit || 'Apt 402');
      setMediaMeta(Array.isArray(data.mediaMeta) ? data.mediaMeta : []);
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    const nextPreviews = mediaFiles.map((file) => ({
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file),
    }));

    setMediaPreviews(nextPreviews);

    return () => {
      nextPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [mediaFiles]);

  useEffect(() => {
    const payload = {
      category,
      urgency,
      building,
      unit,
      specificSpot,
      description,
      mediaMeta,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [category, urgency, building, unit, specificSpot, description, mediaMeta]);

  const validateForm = () => {
    const nextErrors = {};

    if (!category) {
      nextErrors.category = 'Please select a category.';
    }

    if (!specificSpot.trim()) {
      nextErrors.specificSpot = 'Please specify the exact location.';
    }

    if (!building.trim()) {
      nextErrors.building = 'Building is required.';
    }

    if (!unit.trim()) {
      nextErrors.unit = 'Unit is required.';
    }

    if (!description.trim()) {
      nextErrors.description = 'Please add a short description.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (validateForm()) {
      navigate('/report-issue/review', {
        state: {
          category,
          urgency,
          building,
          unit,
          specificSpot,
          description,
          mediaCount: mediaMeta.length,
          mediaFiles,
          mediaMeta,
        },
      });
    }
  };

  const handleMediaChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []).slice(0, 5);
    setMediaFiles(selectedFiles);
    setMediaMeta(
      selectedFiles.map((file) => ({
        name: file.name,
        type: file.type,
      })),
    );
  };

  const handleCancel = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

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
              <span className="text-lg">🔔</span>
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
        <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
          <span className="font-semibold text-slate-700">Step 1 of 2</span>
          <span>Review Details</span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-6">
          <div className="h-full w-2/3 bg-blue-600"></div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/tenant-dashboard')}
              className="text-slate-500 text-sm flex items-center gap-2"
            >
              <span className="text-lg">←</span>
              Back
            </button>
            <h1 className="text-xl font-bold text-slate-900 mt-2">Report an Issue</h1>
            <p className="text-xs text-slate-500 mt-1">What needs fixing? Help us understand the problem.</p>
          </div>

          <form className="px-6 py-5 space-y-6" onSubmit={handleSubmit}>
            <section className="space-y-3">
              <div className="text-xs font-semibold text-slate-700">SECTION 1: THE PROBLEM</div>
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Issue Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className={`mt-2 w-full border rounded-lg px-3 py-2 text-sm text-slate-700 bg-slate-50 ${
                    errors.category ? 'border-red-300' : 'border-slate-200'
                  }`}
                  aria-invalid={Boolean(errors.category)}
                >
                  <option value="">Select category...</option>
                  <option>Plumbing</option>
                  <option>Electrical</option>
                  <option>Appliance</option>
                  <option>Structural</option>
                  <option>Other</option>
                </select>
                {errors.category && <p className="text-[10px] text-red-600 mt-1">{errors.category}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Urgency Level <span className="text-red-500">*</span>
                </label>
                <div className="mt-2 space-y-2">
                  <label
                    className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer ${
                      urgency === 'urgent' ? 'border-blue-500 shadow-sm' : 'border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="urgency"
                      checked={urgency === 'urgent'}
                      onChange={() => setUrgency('urgent')}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-800">URGENT</div>
                      <div className="text-xs text-slate-500">Immediate danger or major damage.</div>
                    </div>
                  </label>
                  <label
                    className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer ${
                      urgency === 'standard' ? 'border-blue-500 shadow-sm' : 'border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="urgency"
                      checked={urgency === 'standard'}
                      onChange={() => setUrgency('standard')}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-800">STANDARD</div>
                      <div className="text-xs text-slate-500">Normal maintenance needed.</div>
                    </div>
                  </label>
                  <label
                    className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer ${
                      urgency === 'low' ? 'border-blue-500 shadow-sm' : 'border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="urgency"
                      checked={urgency === 'low'}
                      onChange={() => setUrgency('low')}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-800">LOW</div>
                      <div className="text-xs text-slate-500">Cosmetic or non-urgent fix.</div>
                    </div>
                  </label>
                </div>
              </div>
            </section>

            <div className="h-px bg-slate-100"></div>

            <section className="space-y-3">
              <div className="text-xs font-semibold text-slate-700">
                SECTION 2: WHERE IS IT? <span className="text-red-500">*</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Building <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={building}
                    onChange={(event) => setBuilding(event.target.value)}
                    className={`mt-2 w-full border rounded-lg px-3 py-2 text-sm text-slate-700 bg-slate-50 ${
                      errors.building ? 'border-red-300' : 'border-slate-200'
                    }`}
                    aria-invalid={Boolean(errors.building)}
                    required
                  />
                  {errors.building && <p className="text-[10px] text-red-600 mt-1">{errors.building}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Unit <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={unit}
                    onChange={(event) => setUnit(event.target.value)}
                    className={`mt-2 w-full border rounded-lg px-3 py-2 text-sm text-slate-700 bg-slate-50 ${
                      errors.unit ? 'border-red-300' : 'border-slate-200'
                    }`}
                    aria-invalid={Boolean(errors.unit)}
                    required
                  />
                  {errors.unit && <p className="text-[10px] text-red-600 mt-1">{errors.unit}</p>}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Specific Spot <span className="text-red-500">*</span>
                </label>
                <input
                  value={specificSpot}
                  onChange={(event) => setSpecificSpot(event.target.value)}
                  className={`mt-2 w-full border rounded-lg px-3 py-2 text-sm text-slate-700 ${
                    errors.specificSpot ? 'border-red-300' : 'border-slate-200'
                  }`}
                  placeholder="e.g. Master Bedroom, Kitchen Sink"
                  aria-invalid={Boolean(errors.specificSpot)}
                />
                {errors.specificSpot && (
                  <p className="text-[10px] text-red-600 mt-1">{errors.specificSpot}</p>
                )}
              </div>
            </section>

            <div className="h-px bg-slate-100"></div>

            <section className="space-y-3">
              <div className="text-xs font-semibold text-slate-700">SECTION 3: TELL US MORE</div>
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows="4"
                  value={description}
                  onChange={(event) => setDescription(event.target.value.slice(0, maxDescriptionLength))}
                  className={`mt-2 w-full border rounded-lg px-3 py-2 text-sm text-slate-700 ${
                    errors.description ? 'border-red-300' : 'border-slate-200'
                  }`}
                  placeholder="Please describe the issue in detail. When did it start? Is it making noise?"
                  aria-invalid={Boolean(errors.description)}
                ></textarea>
                <div className="flex items-center justify-between text-[10px] mt-1">
                  <span className="text-slate-400">{description.length}/{maxDescriptionLength}</span>
                  {errors.description && <span className="text-red-600">{errors.description}</span>}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Photos/Video (Optional)</label>
                <div className="mt-2 border border-dashed border-slate-300 rounded-lg p-5 text-center text-xs text-slate-500 bg-slate-50">
                  <label className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg cursor-pointer">
                    Upload Files
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleMediaChange}
                    />
                  </label>
                  <div className="mt-1">Max 5 files, 10MB each.</div>
                  {mediaPreviews.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2 text-left">
                      {mediaPreviews.map((preview) => (
                        <div key={preview.url} className="border border-slate-200 rounded-lg p-2 bg-white">
                          {preview.type.startsWith('image') ? (
                            <img src={preview.url} alt={preview.name} className="w-full h-16 object-cover rounded" />
                          ) : (
                            <video src={preview.url} className="w-full h-16 object-cover rounded" />
                          )}
                          <p className="mt-1 text-[10px] text-slate-500 truncate">{preview.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <div className="h-px bg-slate-100"></div>

            <section className="space-y-3">
              <div className="text-xs font-semibold text-slate-700">SECTION 4: ACCESS & PREFERENCES</div>
              <label className="flex items-start gap-3 text-xs text-slate-600">
                <input type="checkbox" className="mt-1" />
                <span>I need special access arrangements.</span>
              </label>
              <label className="flex items-start gap-3 text-xs text-slate-600">
                <input type="checkbox" className="mt-1" />
                <span>Pets in the unit.</span>
              </label>
              <label className="flex items-start gap-3 text-xs text-slate-600">
                <input type="checkbox" className="mt-1" />
                <span>Call before arriving. I prefer maintenance staff call me 30 minutes prior.</span>
              </label>

              <div className="bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg px-3 py-2">
                For immediate danger (fire, gas leak), do not use this form. Call 0112-XXX-XXX immediately.
              </div>
            </section>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg"
              >
                Next: Review Details
              </button>
            </div>

            <div className="text-center text-[10px] text-slate-400">
              Your information is secure and only shared with maintenance staff.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
