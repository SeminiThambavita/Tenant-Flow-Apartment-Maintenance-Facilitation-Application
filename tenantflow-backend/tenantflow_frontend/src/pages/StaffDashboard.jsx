import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, issueAPI } from '../api';
import StaffNav from '../components/StaffNav';
import ProfileDropdown from '../components/ProfileDropdown';
import usePolling from '../hooks/usePolling';
import { formatStatusLabel, getStatusBadgeTheme, isOpenStatus, normalizeStatus } from '../utils/issueStatus';
import { getUserProfileImage } from '../utils/profileImage';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cost report submitted', label: 'Cost Report Submitted' },
  { value: 'invoice issued', label: 'Invoice Issued' },
  { value: 'payment done', label: 'Payment Done' },
  { value: 'task done', label: 'Task Done' },
];

export default function StaffDashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const [profile, setProfile] = useState({ name: 'Staff Member', workStatus: 'on-call' });
  const [profileImage, setProfileImage] = useState('');
  const [tasks, setTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');

  const getBuildingLabel = (value) => {
    if (!value) return 'Building';
    if (typeof value === 'string') return value;
    return value.name || 'Building';
  };

  const loadData = useCallback(async () => {
    if (role !== 'staff') return;
    try {
      const [profileResponse, issuesResponse] = await Promise.all([
        authAPI.getProfile(),
        issueAPI.getAll({ status: 'all' }),
      ]);

      const currentUser = profileResponse?.data?.user || {};
      setProfile({
        name: currentUser.name || 'Staff Member',
        workStatus: currentUser.workStatus || 'on-call',
      });
      setProfileImage(getUserProfileImage(currentUser));

      setTasks(issuesResponse?.data?.issues || []);
    } catch {
      setTasks([]);
      setProfileImage('');
    }
  }, [role]);

  useEffect(() => {
    if (role !== 'staff') {
      navigate('/login', { state: { role: 'staff' } });
      return;
    }
    loadData();
  }, [navigate, role, loadData]);

  usePolling(loadData, 5000, role === 'staff');

  const todayLabel = useMemo(() => {
    const date = new Date();
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const openTasks = tasks.filter((task) => isOpenStatus(task.status));
  const todaysTaskCount = openTasks.length;
  const filteredTasks = useMemo(() => {
    if (statusFilter === 'all') return tasks;
    return tasks.filter((task) => normalizeStatus(task.status) === statusFilter);
  }, [statusFilter, tasks]);

  const formatIssueTitle = (task) => {
    const issueType = String(task.issueType || 'maintenance').toLowerCase();
    const spot = String(task.specificSpot || 'general area').toLowerCase();
    return `${issueType}-${spot}`;
  };

  const formatIssueSubtitle = (task) => {
    const unitValue = task.unit || task.unitNumber;
    const location = unitValue ? `Unit ${unitValue}` : 'Unit N/A';
    const priorityText = task.priority
      ? `${task.priority.charAt(0).toUpperCase()}${task.priority.slice(1)} Priority`
      : 'Priority N/A';
    return `${location} • ${priorityText} • ${formatStatusLabel(task.status)}`;
  };

  const formatTime = (dateValue) => {
    if (!dateValue) return 'TBD';
    return new Date(dateValue).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'new' || normalized === 'assigned') return { icon: '🆕', bg: 'bg-[#FEE9E9]' };
    if (normalized === 'in progress') return { icon: '🔧', bg: 'bg-[#FFF4D6]' };
    if (normalized === 'completed') return { icon: '✅', bg: 'bg-[#E8F7EE]' };
    return { icon: '📋', bg: 'bg-[#EEE8FF]' };
  };

  const formatMoney = (value) => `LKR ${Number(value || 0).toFixed(2)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <StaffNav active="dashboard" profileName={profile.name} profileImage={profileImage} />

      <main className="max-w-2xl mx-auto pt-8 pb-10 px-4">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl leading-tight font-bold text-gray-900">Welcome back, {profile.name} 👋</h1>
          <p className="text-sm text-gray-600 mt-2">
            {todayLabel} • <span className="font-semibold text-blue-600">{todaysTaskCount} open task{todaysTaskCount === 1 ? '' : 's'}</span>
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-4">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Work Status</p>
            <p className="text-2xl font-bold text-blue-900 mt-2 capitalize">{profile.workStatus}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-4">
            <p className="text-xs font-bold text-purple-600 uppercase tracking-wide">Tasks Today</p>
            <p className="text-2xl font-bold text-purple-900 mt-2">{todaysTaskCount}</p>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-wider text-gray-600 uppercase">My Assigned Tasks</p>
            <p className="text-sm text-gray-500 mt-1">Updates every 5 seconds</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((item) => {
              const isActive = statusFilter === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setStatusFilter(item.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white px-6 py-12 text-center">
              <p className="text-lg text-gray-600 font-medium">No assigned tasks yet</p>
              <p className="text-sm text-gray-400 mt-2">Try a different status filter or check back soon for new maintenance requests</p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const badge = getStatusBadge(task.status);
              return (
                <button
                  key={task._id}
                  type="button"
                  onClick={() => navigate(`/staff/tasks/${task._id}`)}
                  className="w-full rounded-xl border-2 border-gray-200 bg-white px-5 py-4 flex items-start justify-between gap-4 text-left hover:border-blue-400 hover:shadow-md transition group"
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className={`w-12 h-12 rounded-lg ${badge.bg} flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition`}>
                      {badge.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition truncate">{formatIssueTitle(task)}</p>
                      <p className="text-sm text-gray-600 mt-1 truncate">{formatIssueSubtitle(task)}</p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {getBuildingLabel(task.building)}
                        </span>
                        {task.urgency && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            task.urgency === 'urgent' ? 'bg-red-100 text-red-700' :
                            task.urgency === 'standard' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {task.urgency.charAt(0).toUpperCase() + task.urgency.slice(1)}
                          </span>
                        )}
                        {task.scheduledStartDate && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            📅 Start: {new Date(task.scheduledStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            {task.scheduledStartTime && ` ${task.scheduledStartTime}`}
                          </span>
                        )}
                      </div>

                      {task.currentCostReport && typeof task.currentCostReport === 'object' && (
                        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/80 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">Cost Report Template</p>
                              <p className="text-sm font-semibold text-slate-900 mt-1">
                                {task.currentCostReport.costItems?.length || 0} line item{(task.currentCostReport.costItems?.length || 0) === 1 ? '' : 's'} saved
                              </p>
                            </div>
                            <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700 border border-blue-100">
                              {String(task.currentCostReport.status || 'draft')}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-700">
                            <span className="rounded-full bg-white px-2.5 py-1 border border-blue-100">{formatMoney(task.currentCostReport.totalCost)}</span>
                            <span className="rounded-full bg-white px-2.5 py-1 border border-blue-100">
                              Updated {task.currentCostReport.updatedAt ? new Date(task.currentCostReport.updatedAt).toLocaleDateString() : 'today'}
                            </span>
                          </div>
                          {task.currentCostReport.notes && (
                            <p className="mt-2 text-xs text-slate-600 line-clamp-2">{task.currentCostReport.notes}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right pr-2 shrink-0 flex flex-col items-end gap-2">
                    <span
                      className={`inline-flex items-center justify-center min-w-[5.75rem] h-12 px-3 rounded-full whitespace-nowrap text-[10px] font-bold uppercase tracking-wide ${getStatusBadgeTheme(task.status, 'circle').className}`}
                      title={formatStatusLabel(task.status)}
                    >
                      {formatStatusLabel(task.status)}
                    </span>
                    <p className="text-sm font-semibold text-blue-600 group-hover:text-blue-700">View</p>
                    <p className="text-xs text-gray-500 mt-1">{formatTime(task.updatedAt || task.createdAt)}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
