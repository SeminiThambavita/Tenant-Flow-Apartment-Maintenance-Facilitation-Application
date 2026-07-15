import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import AdminSidebar from '../components/AdminSidebar';
import { buildFileUrl } from '../utils/profileImage';

export default function AdminStaffDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStaffDetails = async () => {
      try {
        const role = localStorage.getItem('role');
        if (role !== 'admin') {
          navigate('/login', { state: { role: 'admin' } });
          return;
        }

        const response = await authAPI.getStaffById(id);
        setStaff(response.data.staff);
      } catch (err) {
        console.error('Error fetching staff details:', err);
        setError(err.response?.data?.message || 'Failed to fetch staff details');
      } finally {
        setLoading(false);
      }
    };

    fetchStaffDetails();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <AdminSidebar active="staff-details" />
        <main className="flex-1 p-8 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </main>
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <AdminSidebar active="staff-details" />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => navigate('/admin/staff-details')}
              className="text-slate-500 hover:text-slate-800 flex items-center gap-2 mb-6"
            >
              ← Back to Staff List
            </button>
            <div className="bg-rose-50 text-rose-700 p-4 rounded-xl border border-rose-100">
              {error || 'Staff member not found'}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <AdminSidebar active="staff-details" />

      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Actions */}
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => navigate('/admin/staff-details')}
              className="text-slate-500 hover:text-slate-800 flex items-center gap-2 font-medium"
            >
              ← Back to Staff List
            </button>
          </div>

          {/* Main Content Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Profile Header */}
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-6">
                  {staff.staffProfilePhoto ? (
                    <img 
                     src={buildFileUrl(staff.staffProfilePhoto)}
                      alt="Profile" 
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold border-4 border-white shadow-sm">
                      {staff.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">{staff.name}</h1>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded">
                        ID: {staff._id.slice(-8).toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        staff.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        staff.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {staff.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">👤</span>
                  Personal Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Email Address</label>
                    <p className="text-slate-900 font-medium">{staff.email}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Phone Number</label>
                    <p className="text-slate-900 font-medium">{staff.phone}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">National ID</label>
                    <p className="text-slate-900 font-medium">{staff.nationalId || staff.nic || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Registered Date</label>
                    <p className="text-slate-900 font-medium">{new Date(staff.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Professional Details */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">💼</span>
                  Professional Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Department</label>
                    <p className="text-slate-900 font-medium capitalize">{staff.primaryDepartment || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Role Type</label>
                    <p className="text-slate-900 font-medium capitalize">{staff.staffType || 'Not specified'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Experience</label>
                      <p className="text-slate-900 font-medium">{staff.yearsOfExperience} years</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Work Status</label>
                      <p className="text-slate-900 font-medium capitalize">{staff.workStatus || 'Not specified'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Secondary Skills</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {staff.secondarySkills && staff.secondarySkills.length > 0 ? (
                         staff.secondarySkills.map((skill, idx) => (
                           <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-sm">
                             {skill}
                           </span>
                         ))
                      ) : (
                        <p className="text-slate-500 text-sm">None specified</p>
                      )}
                    </div>
                  </div>
                  {staff.certifications && (
                    <div>
                      <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Certifications</label>
                      <p className="text-slate-900 font-medium">{staff.certifications}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Availability & Capacity */}
              <div className="col-span-1 lg:col-span-2 border-t border-slate-100 pt-8">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">🕒</span>
                  Availability & Capacity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2">Shift Preference</label>
                    <p className="text-slate-900 font-medium capitalize text-lg">{staff.shift || 'Not specified'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2">Daily Job Limit</label>
                    <p className="text-slate-900 font-medium text-lg">{staff.maxJobsPerDay || 'Not specified'} jobs max</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2">Current Status</label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-3 h-3 rounded-full ${staff.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                      <span className="text-slate-900 font-medium">{staff.isOnline ? 'Online / Available' : 'Offline'}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2">Weekday Hours</label>
                    <div className="bg-white border border-slate-200 rounded-lg p-3 flex justify-between items-center">
                      <span className="text-slate-600">Mon - Fri</span>
                      <span className="font-medium text-slate-900">
                        {staff.availableWeekdaysFrom} - {staff.availableWeekdaysTo}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2">Weekend Hours</label>
                    <div className="bg-white border border-slate-200 rounded-lg p-3 flex justify-between items-center">
                      <span className="text-slate-600">Sat - Sun</span>
                      <span className="font-medium text-slate-900">
                        {(staff.availableWeekendsFrom && staff.availableWeekendsTo) ? 
                          `${staff.availableWeekendsFrom} - ${staff.availableWeekendsTo}` : 
                          'Not available'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="col-span-1 lg:col-span-2 border-t border-slate-100 pt-8">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">🏦</span>
                  Bank Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Bank Name</label>
                    <p className="text-slate-900 font-medium">{staff.bankName || 'Not specified'}</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Branch Name</label>
                    <p className="text-slate-900 font-medium">{staff.branchName || 'Not specified'}</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Branch Code</label>
                    <p className="text-slate-900 font-medium">{staff.branchCode || 'Not specified'}</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Account Number</label>
                    <p className="text-slate-900 font-medium font-mono">{staff.accountNumber || 'Not specified'}</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-4 lg:col-span-4">
                    <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Account Holder</label>
                    <p className="text-slate-900 font-medium">{staff.accountHolderName || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Agreements & Documents */}
              <div className="col-span-1 lg:col-span-2 border-t border-slate-100 pt-8">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">📄</span>
                  Agreements & Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                    <h4 className="font-semibold text-slate-800 mb-4 text-sm uppercase tracking-wider">Agreements Confirmed</h4>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <div className={`mt-0.5 ${staff.agreeBackgroundCheck ? 'text-emerald-500' : 'text-slate-300'}`}>✓</div>
                        <span className="text-sm text-slate-700">Background check authorization</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className={`mt-0.5 ${staff.agreeTerms ? 'text-emerald-500' : 'text-slate-300'}`}>✓</div>
                        <span className="text-sm text-slate-700">Terms of service & Privacy policy</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className={`mt-0.5 ${staff.agreeTax ? 'text-emerald-500' : 'text-slate-300'}`}>✓</div>
                        <span className="text-sm text-slate-700">Independent contractor tax agreement</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className={`mt-0.5 ${staff.agreeProfessional ? 'text-emerald-500' : 'text-slate-300'}`}>✓</div>
                        <span className="text-sm text-slate-700">Professional conduct standards</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                    <h4 className="font-semibold text-slate-800 mb-4 text-sm uppercase tracking-wider">Identity Document</h4>
                    {staff.staffIdDocument ? (
                      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white p-2">
                        <img 
                          src={buildFileUrl(staff.staffIdDocument)}
                          alt="ID Document" 
                          className="w-full h-40 object-contain rounded"
                        />
                        <a 
                          href={buildFileUrl(staff.staffIdDocument)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Full Size
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-40 bg-slate-100 border-2 border-dashed border-slate-200 rounded-lg text-slate-400">
                        No ID document uploaded
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
