import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authAPI } from '../api';
import AdminSidebar from '../components/AdminSidebar';

export default function StaffApprovalDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const role = localStorage.getItem('role');
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const uploadBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/login', { state: { role: 'admin' } });
      return;
    }

    const loadStaff = async () => {
      try {
        const response = await authAPI.getPendingStaffById(id);
        setStaff(response?.data?.staff || null);
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load staff details.');
        setStaff(null);
      } finally {
        setLoading(false);
      }
    };

    loadStaff();
  }, [role, id, navigate]);

  const handleApproveReject = useCallback(
    async (status) => {
      if (!staff) return;
      setActionLoading(status);
      try {
        await authAPI.updateStaffStatus(staff._id, status);
        setTimeout(() => navigate('/admin-dashboard'), 500);
      } catch (err) {
        setError(err.response?.data?.message || `Failed to ${status} staff.`);
      } finally {
        setActionLoading(null);
      }
    },
    [staff, navigate]
  );

  const buildFileUrl = (pathValue) => {
    if (!pathValue) return '';
    if (pathValue.startsWith('http://') || pathValue.startsWith('https://')) return pathValue;
    return `${uploadBaseUrl}${pathValue}`;
  };

  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    if (Array.isArray(value)) return value.length ? value.join(', ') : 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return value;
  };

  return (
    <div className="min-h-screen bg-[#F3F4F8] text-[#1D1D2C] flex">
      <AdminSidebar active="dashboard" profileName="Property Manager" />

      <main className="flex-1 px-12 py-10">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate('/admin-dashboard')}
              className="mt-1 w-7 h-7 rounded-md border border-[#DCE0EE] text-[#596080] bg-white"
            >
              ←
            </button>
            <div>
              <h1 className="text-[35px] leading-9 font-semibold text-[#20253A]">Staff Approval</h1>
              <p className="text-[13px] text-[#7681A8] mt-1">Review and approve/reject staff registration</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg border border-[#DDE2F0] p-8 text-center">
            <p className="text-[#7681A8]">Loading staff details...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        ) : staff ? (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-white rounded-lg border border-[#DDE2F0] p-6 shadow-sm">
              <div className="flex items-start gap-6">
                <div className="flex flex-col gap-4">
                  {staff.staffProfilePhoto && (
                    <div>
                      <p className="text-[12px] font-semibold text-[#596080] mb-2">Profile Photo</p>
                      <img
                        src={buildFileUrl(staff.staffProfilePhoto)}
                        alt="Profile"
                        className="w-32 h-32 rounded-lg object-cover border border-[#DDE2F0]"
                      />
                    </div>
                  )}
                  {staff.staffIdDocument && (
                    <div>
                      <p className="text-[12px] font-semibold text-[#596080] mb-2">ID Document</p>
                      <img
                        src={buildFileUrl(staff.staffIdDocument)}
                        alt="ID Document"
                        className="w-32 h-32 rounded-lg object-cover border border-[#DDE2F0]"
                      />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h2 className="text-[28px] font-semibold text-[#20253A]">{staff.name}</h2>
                  <p className="text-[14px] text-[#7681A8] mt-1">Registration ID: {staff._id.slice(-8).toUpperCase()}</p>
                  <p className="text-[14px] text-[#7681A8] mt-1">
                    Status: <span className="font-semibold text-[#3346F2]">{staff.status || 'Pending'}</span>
                  </p>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-[11px] font-semibold text-[#596080]">Email</p>
                      <p className="text-[13px] text-[#2E3348] mt-1">{formatValue(staff.email)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-[#596080]">Phone</p>
                      <p className="text-[13px] text-[#2E3348] mt-1">{formatValue(staff.phone)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-[#596080]">National ID</p>
                      <p className="text-[13px] text-[#2E3348] mt-1">{formatValue(staff.nationalId)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-[#596080]">Registered On</p>
                      <p className="text-[13px] text-[#2E3348] mt-1">
                        {new Date(staff.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="bg-white rounded-lg border border-[#DDE2F0] p-6 shadow-sm">
              <h3 className="text-[18px] font-semibold text-[#20253A] mb-4">Professional Information</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[11px] font-semibold text-[#596080]">Staff Type</p>
                  <p className="text-[13px] text-[#2E3348] mt-1 capitalize">{formatValue(staff.staffType)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#596080]">Primary Department</p>
                  <p className="text-[13px] text-[#2E3348] mt-1">{formatValue(staff.primaryDepartment)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#596080]">Years of Experience</p>
                  <p className="text-[13px] text-[#2E3348] mt-1">{formatValue(staff.yearsOfExperience)} years</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#596080]">Work Status</p>
                  <p className="text-[13px] text-[#2E3348] mt-1 capitalize">{formatValue(staff.workStatus)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[11px] font-semibold text-[#596080]">Secondary Skills</p>
                  <p className="text-[13px] text-[#2E3348] mt-1">
                    {Array.isArray(staff.secondarySkills) && staff.secondarySkills.length > 0
                      ? staff.secondarySkills.join(', ')
                      : 'None'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[11px] font-semibold text-[#596080]">Certifications</p>
                  <p className="text-[13px] text-[#2E3348] mt-1">{formatValue(staff.certifications)}</p>
                </div>
              </div>
            </div>

            {/* Availability */}
            <div className="bg-white rounded-lg border border-[#DDE2F0] p-6 shadow-sm">
              <h3 className="text-[18px] font-semibold text-[#20253A] mb-4">Availability</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[11px] font-semibold text-[#596080]">Shift</p>
                  <p className="text-[13px] text-[#2E3348] mt-1 capitalize">{formatValue(staff.shift)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#596080]">Max Jobs Per Day</p>
                  <p className="text-[13px] text-[#2E3348] mt-1">{formatValue(staff.maxJobsPerDay)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#596080]">Weekdays Availability</p>
                  <p className="text-[13px] text-[#2E3348] mt-1">
                    {formatValue(staff.availableWeekdaysFrom)} - {formatValue(staff.availableWeekdaysTo)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#596080]">Weekends Availability</p>
                  <p className="text-[13px] text-[#2E3348] mt-1">
                    {formatValue(staff.availableWeekendsFrom)} - {formatValue(staff.availableWeekendsTo)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#596080]">Online Status</p>
                  <p className="text-[13px] text-[#2E3348] mt-1">{staff.isOnline ? 'Online' : 'Offline'}</p>
                </div>
              </div>
            </div>

            {/* Bank Information */}
            <div className="bg-white rounded-lg border border-[#DDE2F0] p-6 shadow-sm">
              <h3 className="text-[18px] font-semibold text-[#20253A] mb-4">Bank Information</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[11px] font-semibold text-[#596080]">Bank Name</p>
                  <p className="text-[13px] text-[#2E3348] mt-1">{formatValue(staff.bankName)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#596080]">Branch Name</p>
                  <p className="text-[13px] text-[#2E3348] mt-1">{formatValue(staff.branchName)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#596080]">Account Holder Name</p>
                  <p className="text-[13px] text-[#2E3348] mt-1">{formatValue(staff.accountHolderName)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#596080]">Account Number</p>
                  <p className="text-[13px] text-[#2E3348] mt-1">{formatValue(staff.accountNumber)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#596080]">Branch Code</p>
                  <p className="text-[13px] text-[#2E3348] mt-1">{formatValue(staff.branchCode)}</p>
                </div>
              </div>
            </div>

            {/* Agreements */}
            <div className="bg-white rounded-lg border border-[#DDE2F0] p-6 shadow-sm">
              <h3 className="text-[18px] font-semibold text-[#20253A] mb-4">Agreements & Consent</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[18px]">{staff.agreeBackgroundCheck ? '✓' : '✗'}</span>
                  <p className="text-[13px] text-[#2E3348]">Agrees to Background Check</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[18px]">{staff.agreeTerms ? '✓' : '✗'}</span>
                  <p className="text-[13px] text-[#2E3348]">Agrees to Terms & Conditions</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[18px]">{staff.agreeTax ? '✓' : '✗'}</span>
                  <p className="text-[13px] text-[#2E3348]">Agrees to Tax Information Disclosure</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[18px]">{staff.agreeProfessional ? '✓' : '✗'}</span>
                  <p className="text-[13px] text-[#2E3348]">Agrees to Professional Code of Conduct</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg border border-[#DDE2F0] p-6 shadow-sm flex gap-3 justify-between">
              <button
                onClick={() => navigate('/admin-dashboard')}
                className="px-6 py-2 rounded border border-[#DDE2F0] text-[#2E3348] hover:bg-[#F6F7FB] font-medium"
              >
                Back to Dashboard
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => handleApproveReject('rejected')}
                  disabled={actionLoading === 'rejected'}
                  className="px-6 py-2 rounded border border-red-300 text-red-600 hover:bg-red-50 font-medium disabled:opacity-50"
                >
                  {actionLoading === 'rejected' ? 'Rejecting...' : 'Reject'}
                </button>
                <button
                  onClick={() => handleApproveReject('approved')}
                  disabled={actionLoading === 'approved'}
                  className="px-6 py-2 rounded bg-green-600 text-white hover:bg-green-700 font-medium disabled:opacity-50"
                >
                  {actionLoading === 'approved' ? 'Approving...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
