import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, issueAPI } from '../api';
import StaffNav from '../components/StaffNav';
import ProfileDropdown from '../components/ProfileDropdown';
import usePolling from '../hooks/usePolling';
import { formatStatusLabel, isOpenStatus } from '../utils/issueStatus';

const ISSUE_LABELS = {
  plumbing: 'Water Leak',
  electrical: 'Electrical Issue',
  cleaning: 'Cleaning Task',
  carpentry: 'Carpentry Work',
  other: 'Maintenance Task',
};

export default function StaffDashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const [profile, setProfile] = useState({ name: 'Staff Member', workStatus: 'on-call' });
  const [tasks, setTasks] = useState([]);

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

      setTasks(issuesResponse?.data?.issues || []);
    } catch {
      setTasks([]);
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

  const formatIssueTitle = (task) => {
    const baseTitle = ISSUE_LABELS[task.issueType] || 'Maintenance Task';
    return `${baseTitle} - ${task.specificSpot || 'General Area'}`;
  };

  const formatIssueSubtitle = (task) => {
    const location = task.unitNumber ? `Unit ${task.unitNumber}` : 'Unit N/A';
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

  return (
    <div className="min-h-screen bg-[#F4F5F9] text-[#171A2A]">
      <StaffNav active="dashboard" profileName={profile.name} />

      <main className="max-w-[700px] mx-auto pt-10 pb-10 px-4">
        <h1 className="text-3xl md:text-4xl leading-tight font-semibold mb-1">Welcome back, {profile.name}</h1>
        <p className="text-sm text-[#7681A8] mb-6">
          {todayLabel} • {todaysTaskCount} open task{todaysTaskCount === 1 ? '' : 's'}
        </p>

        <div className="mb-3 flex items-center justify-between">
          <p className="text-[12px] font-semibold tracking-[0.08em] text-[#8A96B7]">MY ASSIGNED TASKS</p>
          <p className="text-[11px] text-[#7681A8]">Updates every 5s</p>
        </div>

        <div className="space-y-2.5">
          {tasks.length === 0 ? (
            <div className="rounded-xl border border-[#E5E8F1] bg-white px-5 py-6 text-[14px] text-[#7681A8]">
              No assigned tasks yet.
            </div>
          ) : (
            tasks.map((task) => {
              const badge = getStatusBadge(task.status);
              return (
                <button
                  key={task._id}
                  type="button"
                  onClick={() => navigate(`/staff/tasks/${task._id}`)}
                  className="w-full rounded-xl border border-[#E5E8F1] bg-white px-4 py-3 flex items-center justify-between gap-3 text-left hover:border-[#3F46F0] transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-lg ${badge.bg} flex items-center justify-center text-sm shrink-0`}>
                      {badge.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold truncate">{formatIssueTitle(task)}</p>
                      <p className="text-[13px] text-[#7B87AD] truncate">{formatIssueSubtitle(task)}</p>
                    </div>
                  </div>
                  <div className="text-right pr-1 shrink-0">
                    <p className="text-[12px] font-semibold text-[#3F46F0]">View details</p>
                    <p className="text-[12px] text-[#7783A8]">{formatTime(task.updatedAt || task.createdAt)}</p>
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
