import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, issueAPI } from '../api';
import AdminSidebar from '../components/AdminSidebar';
import ProfileDropdown from '../components/ProfileDropdown';
import usePolling from '../hooks/usePolling';
import { formatStatusLabel, isOpenStatus } from '../utils/issueStatus';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
  const [issues, setIssues] = useState([]);
  const [pendingStaff, setPendingStaff] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [selectedPendingStaffId, setSelectedPendingStaffId] = useState('');
  const [selectedPendingStaff, setSelectedPendingStaff] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/login', { state: { role: 'admin' } });
      return;
    }

    const loadData = async () => {
      try {
        const [profileResponse, issueResponse, pendingResponse] = await Promise.all([
          authAPI.getProfile(),
          issueAPI.getAll({ status: 'all' }),
          authAPI.getPendingStaff()
        ]);

        const currentUser = profileResponse?.data?.user || {};
        setProfile({
          name: currentUser.name || 'Property Manager',
          email: currentUser.email || '',
          phone: currentUser.phone || ''
        });
        setIssues(issueResponse?.data?.issues || []);
        setPendingStaff(pendingResponse?.data?.staff || []);

        const issueUpdates = (issueResponse?.data?.issues || [])
          .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
          .slice(0, 6)
          .map((item) => ({
            id: item._id,
            title: `${item.issueType || 'Maintenance'} update`,
            message: `${item.building || 'N/A'} ${item.unitNumber || ''} • ${formatStatusLabel(item.status)}${item.assignedTo?.name ? ` • Staff: ${item.assignedTo.name}` : ''}`,
            createdAt: item.updatedAt || item.createdAt,
            read: false
          }));

        const staffUpdates = (pendingResponse?.data?.staff || []).slice(0, 3).map((staff) => ({
          id: `staff-${staff._id}`,
          title: 'Staff approval pending',
          message: `${staff.name} is waiting for approval`,
          createdAt: staff.createdAt,
          read: false
        }));

        setNotifications([...staffUpdates, ...issueUpdates].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch {
        setIssues([]);
        setPendingStaff([]);
        setNotifications([]);
      }
    };

    loadData();
  }, [role, navigate]);

  const refreshIssues = useCallback(async () => {
    if (role !== 'admin') return;
    try {
      const issueResponse = await issueAPI.getAll({ status: 'all' });
      setIssues(issueResponse?.data?.issues || []);
    } catch {
      setIssues([]);
    }
  }, [role]);

  usePolling(refreshIssues, 5000, role === 'admin');

  const inProgressRepairs = useMemo(
    () => issues.filter((item) => isOpenStatus(item.status) && item.assignedTo).length,
    [issues]
  );

  const unassignedTasks = useMemo(
    () => issues.filter((item) => !item.assignedTo && String(item.status || '').toLowerCase() === 'new').length,
    [issues]
  );

  const recentActivity = useMemo(() => {
    return [...issues]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
      .slice(0, 3)
      .map((issue) => ({
        id: issue._id,
        title: `${issue.issueType || 'Maintenance'} • ${issue.building || 'N/A'} ${issue.unitNumber || ''}`,
        message: `Status: ${formatStatusLabel(issue.status)}${issue.assignedTo?.name ? ` • Staff: ${issue.assignedTo.name}` : ''}`,
        createdAt: issue.updatedAt || issue.createdAt
      }));
  }, [issues]);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const handleNotificationClick = (notification) => {
    setNotifications((prev) => prev.map((item) => (item.id === notification.id ? { ...item, read: true } : item)));
    setShowNotifications(false);
  };

  const handleApproveReject = async (staffId, status) => {
    setActionLoadingId(staffId + status);
    try {
      await authAPI.updateStaffStatus(staffId, status);
      setPendingStaff((prev) => prev.filter((staff) => staff._id !== staffId));
      if (selectedPendingStaffId === staffId) {
        setSelectedPendingStaffId('');
        setSelectedPendingStaff(null);
        setDetailsError('');
      }
    } catch {
      // ignore and keep current state
    } finally {
      setActionLoadingId('');
    }
  };

  const handleViewDetails = async (staffId) => {
    if (selectedPendingStaffId === staffId && selectedPendingStaff) {
      setSelectedPendingStaffId('');
      setSelectedPendingStaff(null);
      setDetailsError('');
      return;
    }

    setSelectedPendingStaffId(staffId);
    setDetailsLoading(true);
    setDetailsError('');

    try {
      const response = await authAPI.getPendingStaffById(staffId);
      setSelectedPendingStaff(response?.data?.staff || null);
    } catch (error) {
      setSelectedPendingStaff(null);
      setDetailsError(error.response?.data?.message || 'Failed to load registration details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'PM';
    const parts = name.split(' ').filter(Boolean);
    return parts.slice(0, 2).map((item) => item[0]?.toUpperCase()).join('');
  };

  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    if (Array.isArray(value)) return value.length ? value.join(', ') : 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return value;
  };

  const uploadBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const buildFileUrl = (pathValue) => {
    if (!pathValue) return '';
    if (pathValue.startsWith('http://') || pathValue.startsWith('https://')) return pathValue;
    return `${uploadBaseUrl}${pathValue}`;
  };

  return (
    <div className="min-h-screen bg-[#F3F4F8] text-[#1D1D2C] flex">
      <AdminSidebar active="dashboard" profileName={profile.name} />

      <main className="flex-1 px-12 py-10">
        <div className="flex items-start justify-between mb-7">
          <div className="flex items-start gap-4">
            <button onClick={() => navigate(-1)} className="mt-1 w-7 h-7 rounded-md border border-[#DCE0EE] text-[#596080] bg-white">←</button>
            <div>
              <h1 className="text-[35px] leading-9 font-semibold text-[#20253A]">Welcome, {profile.name || 'Property Manager'}</h1>
              <p className="text-[13px] text-[#7681A8] mt-1">Here is what's happening with your properties today.</p>
            </div>
          </div>

          <div className="flex items-center gap-5 mt-1">
            <button className="w-8 h-8 rounded-md border border-[#E2E6F2] bg-white text-[#5E6686]">💬</button>
            <div className="relative">
              <button
                onClick={() => setShowNotifications((prev) => !prev)}
                className="w-8 h-8 rounded-md border border-[#E2E6F2] bg-white text-[#5E6686] relative"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-[#E2E6F2] rounded-lg shadow z-50 overflow-hidden">
                  <div className="px-3 py-2 text-[11px] font-semibold text-[#596080] border-b border-[#EEF0F6]">Notifications</div>
                  {notifications.length === 0 ? (
                    <div className="px-3 py-4 text-[11px] text-[#7681A8]">No notifications yet.</div>
                  ) : (
                    notifications.slice(0, 6).map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className="w-full text-left px-3 py-2 border-b border-[#EEF0F6] hover:bg-[#F7F8FC]"
                      >
                        <p className="text-[11px] font-semibold text-[#20253A]">{notification.title}</p>
                        {notification.message && <p className="text-[10px] text-[#7681A8] mt-0.5">{notification.message}</p>}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <ProfileDropdown userName={profile.name} userInitials={getInitials(profile.name)} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <button
            onClick={() => navigate('/admin/staff-assignments')}
            className="bg-white rounded-lg border border-[#DDE2F0] px-4 py-3 text-left"
          >
            <p className="text-[11px] text-[#4B5AA4] mb-1">Unassigned Tasks</p>
            <div className="flex items-center justify-between">
              <p className="text-[33px] font-semibold leading-none text-[#1F2233]">{unassignedTasks}</p>
              <span className="text-[#3346F2] text-sm">⌁</span>
            </div>
          </button>
          <button
            onClick={() => navigate('/admin/in-progress-repairs')}
            className="bg-white rounded-lg border border-[#DDE2F0] px-4 py-3 text-left"
          >
            <p className="text-[11px] text-[#4B5AA4] mb-1">In-Progress Repairs</p>
            <div className="flex items-center justify-between">
              <p className="text-[33px] font-semibold leading-none text-[#1F2233]">{inProgressRepairs}</p>
              <span className="text-[#3346F2] text-sm">⚒</span>
            </div>
          </button>
          <div className="bg-white rounded-lg border border-[#DDE2F0] px-4 py-3">
            <p className="text-[11px] text-[#4B5AA4] mb-1">Pending Approvals</p>
            <div className="flex items-center justify-between">
              <p className="text-[33px] font-semibold leading-none text-[#1F2233]">{pendingStaff.length}</p>
              <span className="text-[#F0642A] text-sm">☍</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_265px] gap-3 mb-4">
          <div className="bg-white rounded-lg border border-[#DDE2F0] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#ECEFF7] flex justify-between items-center">
              <h2 className="text-[22px] font-semibold text-[#1F2233]">Pending Cost Approvals</h2>
              <button className="text-[12px] text-[#3346F2] font-semibold">View All</button>
            </div>

            <div className="grid grid-cols-4 px-4 py-2 text-[10px] font-semibold text-[#7079A3] bg-[#F7F8FC] border-b border-[#ECEFF7]">
              <span>STAFF NAME</span>
              <span>TASK ID</span>
              <span>TOTAL COST (LKR)</span>
              <span>ACTIONS</span>
            </div>

            {[
              { initials: 'AP', name: 'Arjun Perera', task: 'TASK-4021', cost: '15,000' },
              { initials: 'DS', name: 'Dilshan Silva', task: 'TASK-3988', cost: '8,500' },
              { initials: 'KR', name: 'Kasun Rajitha', task: 'TASK-4102', cost: '22,400' }
            ].map((row) => (
              <div key={row.task} className="grid grid-cols-4 items-center px-4 py-2.5 text-[11px] border-b last:border-b-0 border-[#ECEFF7]">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#E9EDFF] text-[#3346F2] text-[9px] flex items-center justify-center">{row.initials}</div>
                  <span>{row.name}</span>
                </div>
                <span className="text-[#5D68A7]">{row.task}</span>
                <span className="font-semibold">{row.cost}</span>
                <div className="flex gap-1.5">
                  <button className="px-2 py-0.5 rounded bg-[#3346F2] text-white text-[10px]">Approve</button>
                  <button className="px-2 py-0.5 rounded border border-[#F1D7D7] text-[#E05353] text-[10px] bg-white">Reject</button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg border border-[#DDE2F0] p-3">
            <h3 className="text-[20px] font-semibold text-[#1F2233] mb-3">Pending Staff Join Approvals</h3>

            <div className="space-y-2.5">
              {pendingStaff.length === 0 ? (
                <p className="text-[11px] text-[#7681A8]">No pending staff registrations.</p>
              ) : (
                pendingStaff.slice(0, 5).map((staff) => (
                <div key={staff._id} className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-[#F6D4A7] text-[#2E3348] text-[10px] font-semibold flex items-center justify-center">{getInitials(staff.name)}</div>
                    <span className="text-[11px] truncate">{staff.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px]">
                    <button
                      onClick={() => handleViewDetails(staff._id)}
                      className="text-[#6C77A8]"
                    >
                      {selectedPendingStaffId === staff._id ? 'HIDE DETAILS' : 'VIEW DETAILS'}
                    </button>
                    <button
                      onClick={() => handleApproveReject(staff._id, 'approved')}
                      disabled={actionLoadingId === `${staff._id}approved`}
                      className="px-1.5 py-0.5 rounded bg-[#3346F2] text-white"
                    >
                      {actionLoadingId === `${staff._id}approved` ? '...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleApproveReject(staff._id, 'rejected')}
                      disabled={actionLoadingId === `${staff._id}rejected`}
                      className="px-1.5 py-0.5 rounded border border-[#F1D7D7] text-[#E05353]"
                    >
                      {actionLoadingId === `${staff._id}rejected` ? '...' : 'Reject'}
                    </button>
                  </div>
                </div>
                ))
              )}
            </div>

            {(detailsLoading || detailsError || selectedPendingStaff) && (
              <div className="mt-3 p-2.5 border border-[#DDE2F0] rounded-md bg-[#F8F9FD] text-[10px] text-[#2A2E3F] space-y-1.5">
                {detailsLoading && <p>Loading registration details...</p>}

                {!detailsLoading && detailsError && (
                  <p className="text-[#E05353]">{detailsError}</p>
                )}

                {!detailsLoading && !detailsError && selectedPendingStaff && (
                  <>
                    <p className="font-semibold text-[11px] text-[#1F2233]">{selectedPendingStaff.name} - Registration Details</p>
                    <p><span className="font-semibold">Email:</span> {formatValue(selectedPendingStaff.email)}</p>
                    <p><span className="font-semibold">Phone:</span> {formatValue(selectedPendingStaff.phone)}</p>
                    <p><span className="font-semibold">National ID:</span> {formatValue(selectedPendingStaff.nationalId)}</p>
                    <p><span className="font-semibold">Primary Department:</span> {formatValue(selectedPendingStaff.primaryDepartment)}</p>
                    <p><span className="font-semibold">Secondary Skills:</span> {formatValue(selectedPendingStaff.secondarySkills)}</p>
                    <p><span className="font-semibold">Years of Experience:</span> {formatValue(selectedPendingStaff.yearsOfExperience)}</p>
                    <p><span className="font-semibold">Certifications:</span> {formatValue(selectedPendingStaff.certifications)}</p>
                    <p><span className="font-semibold">Work Status:</span> {formatValue(selectedPendingStaff.workStatus)}</p>
                    <p><span className="font-semibold">Max Jobs Per Day:</span> {formatValue(selectedPendingStaff.maxJobsPerDay)}</p>
                    <p><span className="font-semibold">Weekdays:</span> {formatValue(selectedPendingStaff.availableWeekdaysFrom)} - {formatValue(selectedPendingStaff.availableWeekdaysTo)}</p>
                    <p><span className="font-semibold">Weekends:</span> {formatValue(selectedPendingStaff.availableWeekendsFrom)} - {formatValue(selectedPendingStaff.availableWeekendsTo)}</p>
                    <p><span className="font-semibold">Bank Name:</span> {formatValue(selectedPendingStaff.bankName)}</p>
                    <p><span className="font-semibold">Account Number:</span> {formatValue(selectedPendingStaff.accountNumber)}</p>
                    <p><span className="font-semibold">Account Holder:</span> {formatValue(selectedPendingStaff.accountHolderName)}</p>
                    <p><span className="font-semibold">Branch Code:</span> {formatValue(selectedPendingStaff.branchCode)}</p>
                    <p><span className="font-semibold">Agreed Background Check:</span> {formatValue(selectedPendingStaff.agreeBackgroundCheck)}</p>
                    <p><span className="font-semibold">Agreed Terms:</span> {formatValue(selectedPendingStaff.agreeTerms)}</p>
                    <p><span className="font-semibold">Agreed Tax:</span> {formatValue(selectedPendingStaff.agreeTax)}</p>
                    <p><span className="font-semibold">Agreed Professional:</span> {formatValue(selectedPendingStaff.agreeProfessional)}</p>
                    <div className="pt-1">
                      <p><span className="font-semibold">Profile Photo:</span> {selectedPendingStaff.staffProfilePhoto ? <a href={buildFileUrl(selectedPendingStaff.staffProfilePhoto)} target="_blank" rel="noreferrer" className="text-[#3346F2]">View File</a> : 'N/A'}</p>
                      <p><span className="font-semibold">ID Document:</span> {selectedPendingStaff.staffIdDocument ? <a href={buildFileUrl(selectedPendingStaff.staffIdDocument)} target="_blank" rel="noreferrer" className="text-[#3346F2]">View File</a> : 'N/A'}</p>
                    </div>
                  </>
                )}
              </div>
            )}

            <button
              onClick={() => navigate('/admin/staff-assignments')}
              className="w-full mt-4 border border-[#DDE2F0] rounded-md py-1.5 text-[11px] font-medium"
            >
              Manage Workforce
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#DDE2F0] p-4 max-w-[980px]">
          <h3 className="text-[22px] font-semibold text-[#1F2233] mb-2">Recent Activity</h3>
          <div className="space-y-3 text-[11px]">
            {recentActivity.length === 0 ? (
              <p className="text-[#6E79A9]">No recent updates.</p>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#E4EEFF] text-[#3E6FE2] flex items-center justify-center text-[10px]">◫</div>
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-[#6E79A9]">{activity.message}</p>
                    <p className="text-[#7D87B1] mt-0.5">{new Date(activity.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
