import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAPI, issueAPI } from '../api';
import AdminSidebar from '../components/AdminSidebar';
import ProfileDropdown from '../components/ProfileDropdown';
import CostReportsDashboard from '../components/CostReportsDashboard';
import NotificationBell from '../components/NotificationBell';
import usePolling from '../hooks/usePolling';
import { formatStatusLabel, isOpenStatus } from '../utils/issueStatus';
import { getUserProfileImage } from '../utils/profileImage';

const getBuildingLabel = (value) => {
  if (!value) return 'N/A';
  if (typeof value === 'string') return value;
  return value.name || 'N/A';
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem('role');
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
  const [profileImage, setProfileImage] = useState('');
  const [issues, setIssues] = useState([]);
  const [pendingStaff, setPendingStaff] = useState([]);
  const [actionLoadingId, setActionLoadingId] = useState('');

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
        setProfileImage(getUserProfileImage(currentUser));
        setIssues(issueResponse?.data?.issues || []);
        setPendingStaff(pendingResponse?.data?.staff || []);

      } catch {
        setIssues([]);
        setPendingStaff([]);
        setProfileImage('');
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
        title: `${issue.issueType || 'Maintenance'} • ${getBuildingLabel(issue.building)} ${issue.unit || issue.unitNumber || ''}`,
        message: `Status: ${formatStatusLabel(issue.status)}${issue.assignedTo?.name ? ` • Staff: ${issue.assignedTo.name}` : ''}`,
        createdAt: issue.updatedAt || issue.createdAt
      }));
  }, [issues]);

  const handleApproveReject = async (staffId, status) => {
    setActionLoadingId(staffId + status);
    try {
      await authAPI.updateStaffStatus(staffId, status);
      setPendingStaff((prev) => prev.filter((staff) => staff._id !== staffId));
    } catch {
      // ignore and keep current state
    } finally {
      setActionLoadingId('');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'PM';
    const parts = name.split(' ').filter(Boolean);
    return parts.slice(0, 2).map((item) => item[0]?.toUpperCase()).join('');
  };

  useEffect(() => {
    if (location.hash !== '#cost-report-approvals') return;
    const element = document.getElementById('cost-report-approvals');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  useEffect(() => {
    if (location.hash !== '#staff-approvals') return;
    const element = document.getElementById('staff-approvals');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  const sidebarActive = location.hash === '#cost-report-approvals'
    ? 'cost-reports'
    : location.hash === '#staff-approvals'
      ? 'staff-approvals'
      : 'dashboard';

  return (
    <div className="min-h-screen bg-[#F3F4F8] text-[#1D1D2C] flex">
      <AdminSidebar active={sidebarActive} profileName={profile.name} />

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
            <NotificationBell />
            <div className="flex justify-end">
              <ProfileDropdown userName={profile.name} userInitials={getInitials(profile.name)} profileImage={profileImage} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => navigate('/admin/staff-assignments')}
            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 px-4 py-5 text-left hover:shadow-md transition"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Unassigned Tasks</p>
              <span className="text-2xl">📌</span>
            </div>
            <p className="text-3xl font-bold text-blue-900">{unassignedTasks}</p>
            <p className="text-xs text-blue-700 mt-2">Waiting for assignment</p>
          </button>

          <button
            onClick={() => navigate('/admin/in-progress-repairs')}
            className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200 px-4 py-5 text-left hover:shadow-md transition"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">In Progress</p>
              <span className="text-2xl">⚙️</span>
            </div>
            <p className="text-3xl font-bold text-orange-900">{inProgressRepairs}</p>
            <p className="text-xs text-orange-700 mt-2">Staff working now</p>
          </button>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 px-4 py-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Pending Approvals</p>
              <span className="text-2xl">✋</span>
            </div>
            <p className="text-3xl font-bold text-purple-900">{pendingStaff.length}</p>
            <p className="text-xs text-purple-700 mt-2">Staff registrations</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 px-4 py-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Total Issues</p>
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-3xl font-bold text-green-900">{issues.length}</p>
            <p className="text-xs text-green-700 mt-2">All-time reports</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div id="cost-report-approvals" className="lg:col-span-2 bg-white rounded-lg border border-[#DDE2F0] overflow-hidden shadow-sm">
            <CostReportsDashboard />
          </div>

          <div id="staff-approvals" className="bg-white rounded-lg border border-[#DDE2F0] p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>👥</span> Staff Approvals ({pendingStaff.length})
            </h3>

            <div className="space-y-3">
              {pendingStaff.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">No pending approvals</p>
              ) : (
                pendingStaff.slice(0, 5).map((staff) => (
                <div key={staff._id} className="flex items-center justify-between gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {getInitials(staff.name)}
                    </div>
                    <span className="text-sm font-medium text-gray-900 truncate">{staff.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => navigate(`/admin/staff-approval/${staff._id}`)}
                      className="text-xs px-3 py-1.5 text-blue-600 border border-blue-300 rounded hover:bg-blue-50 font-medium"
                    >
                      View Details
                    </button>
                  </div>
                </div>
                ))
              )}
            </div>

            <button
              onClick={() => navigate('/admin/staff-assignments')}
              className="w-full mt-4 px-3 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
            >
              Manage All Staff
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#DDE2F0] p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>📋</span> Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 py-6 text-center">No recent updates</p>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-2"></div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600">{activity.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(activity.createdAt).toLocaleString()}</p>
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
