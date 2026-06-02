import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAPI, issueAPI } from '../api';
import AdminSidebar from '../components/AdminSidebar';
import IssueMediaGallery from '../components/IssueMediaGallery';
import usePolling from '../hooks/usePolling';
import { broadcastStatusRefresh } from '../utils/statusRefresh';

const ISSUE_LABELS = {
  plumbing: 'Plumbing Issue',
  electrical: 'Electrical Issue',
  cleaning: 'Cleaning Task',
  carpentry: 'Carpentry Task',
  other: 'General Maintenance'
};

const ISSUE_TYPE_TO_SKILLS = {
  plumbing: ['plumber'],
  electrical: ['electrician'],
  cleaning: ['cleaner'],
  carpentry: ['carpenter'],
  other: ['plumber', 'electrician', 'cleaner', 'carpenter', 'other']
};

const URGENCY_STYLES = {
  urgent: 'bg-[#FFEDE7] text-[#F0642A]',
  standard: 'bg-[#EAF2FF] text-[#3D7BEE]',
  low: 'bg-[#EEF1F6] text-[#596080]'
};

const URGENCY_DISPLAY = {
  urgent: 'Urgent',
  standard: 'Standard',
  low: 'Low'
};

const SPECIAL_ARRANGEMENT_LABELS = {
  specialAccess: 'Special access arrangements',
  petsInUnit: 'Pets in the unit',
  callBeforeArriving: 'Call before arriving',
};

const todayStr = () => new Date().toISOString().split('T')[0];

export default function AdminTaskAssignment() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem('role');
  const [profileName, setProfileName] = useState('Property Manager');
  const [issues, setIssues] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [selectedIssueForDetails, setSelectedIssueForDetails] = useState(null);
  const [filterBySkill, setFilterBySkill] = useState(true);
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [scheduledStartDate, setScheduledStartDate] = useState('');
  const [scheduledStartTime, setScheduledStartTime] = useState('');
  const [dateError, setDateError] = useState('');

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/login', { state: { role: 'admin' } });
      return;
    }
    const loadData = async () => {
      try {
        const [profileResponse, issueResponse, staffResponse] = await Promise.all([
          authAPI.getProfile(),
          issueAPI.getAll({ status: 'all' }),
          authAPI.getApprovedStaff()
        ]);
        const currentUser = profileResponse?.data?.user || {};
        setProfileName(currentUser.name || 'Property Manager');
        setIssues(issueResponse?.data?.issues || []);
        setStaffMembers(staffResponse?.data?.staff || []);
      } catch {
        setIssues([]);
        setStaffMembers([]);
      }
    };
    loadData();
  }, [navigate, role]);

  usePolling(async () => {
    if (role !== 'admin') return;
    try {
      const [profileResponse, issueResponse, staffResponse] = await Promise.all([
        authAPI.getProfile(),
        issueAPI.getAll({ status: 'all' }),
        authAPI.getApprovedStaff()
      ]);
      const currentUser = profileResponse?.data?.user || {};
      setProfileName(currentUser.name || 'Property Manager');
      setIssues(issueResponse?.data?.issues || []);
      setStaffMembers(staffResponse?.data?.staff || []);
    } catch {}
  }, 5000, role === 'admin');

  useEffect(() => {
    const selectedIssueId = location.state?.selectedIssueId;
    if (!selectedIssueId || !issues.length) return;
    const match = issues.find((issue) => issue._id === selectedIssueId);
    if (match) setSelectedIssueForDetails(match);
  }, [issues, location.state]);

  const unassignedTasks = useMemo(
    () => issues.filter((issue) => !issue.assignedTo && issue.status === 'new'),
    [issues]
  );

  const filteredTasks = useMemo(() => {
    if (urgencyFilter === 'all') return unassignedTasks;
    return unassignedTasks.filter((t) => (t.urgency || 'standard') === urgencyFilter);
  }, [unassignedTasks, urgencyFilter]);

  const staffTaskCounts = useMemo(() => {
    const counts = {};
    issues.forEach((issue) => {
      const staffId = issue.assignedTo?._id || issue.assignedTo;
      if (staffId && ['new', 'assigned', 'in progress'].includes(String(issue.status || '').toLowerCase())) {
        counts[staffId] = (counts[staffId] || 0) + 1;
      }
    });
    return counts;
  }, [issues]);

  const selectedStaff = staffMembers.find((staff) => staff._id === selectedStaffId);

  const filteredStaffMembers = useMemo(() => {
    if (!selectedTaskIds.length || !filterBySkill) return staffMembers;
    const selectedTask = filteredTasks.find((task) => selectedTaskIds[0] === task._id);
    if (!selectedTask) return staffMembers;
    const requiredSkills = ISSUE_TYPE_TO_SKILLS[selectedTask.issueType] || [];
    return staffMembers.filter((staff) => {
      const staffType = staff.staffType || staff.primaryDepartment || '';
      return requiredSkills.includes(staffType.toLowerCase());
    });
  }, [selectedTaskIds, staffMembers, filterBySkill, filteredTasks]);

  const formatIssueTitle = (issue) => ISSUE_LABELS[issue.issueType] || 'Maintenance Task';

  const formatTaskMeta = (issue) => {
    const unit = issue.unit ? `Unit ${issue.unit}` : 'Unit N/A';
    const minutesAgo = Math.max(1, Math.floor((Date.now() - new Date(issue.createdAt).getTime()) / 60000));
    const hoursAgo = Math.floor(minutesAgo / 60);
    return `${unit} • Reported ${hoursAgo >= 1 ? `${hoursAgo}h` : `${minutesAgo}m`} ago`;
  };

  const toggleTask = (taskId, issue) => {
    setSelectedTaskIds((prev) => (prev[0] === taskId ? [] : [taskId]));
    setSelectedIssueForDetails(issue);
  };

  const clearSelection = () => {
    setSelectedTaskIds([]);
    setSelectedStaffId('');
    setSelectedIssueForDetails(null);
    setScheduledStartDate('');
    setScheduledStartTime('');
    setDateError('');
  };

  const handleAssign = async () => {
    if (!scheduledStartDate) {
      setDateError('A scheduled start date is required before assigning.');
      return;
    }
    setDateError('');
    if (!selectedStaffId || selectedTaskIds.length === 0) return;

    const assignedIds = [...selectedTaskIds];
    setAssigning(true);
    try {
      await Promise.all(
        assignedIds.map((taskId) =>
          issueAPI.update(taskId, {
            assignedTo: selectedStaffId,
            status: 'assigned',
            scheduledStartDate,
            scheduledStartTime: scheduledStartTime || undefined
          })
        )
      );
      broadcastStatusRefresh();
      const refreshedIssues = await issueAPI.getAll({ status: 'all' });
      setIssues(refreshedIssues?.data?.issues || []);
      clearSelection();
      navigate('/admin/in-progress-repairs', { state: { highlightedTaskIds: assignedIds } });
    } catch {
      // keep for retry
    } finally {
      setAssigning(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'ST';
    return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
  };

  const urgencyCounts = useMemo(() => {
    const counts = { all: unassignedTasks.length, urgent: 0, standard: 0, low: 0 };
    unassignedTasks.forEach((t) => {
      const u = t.urgency || 'standard';
      if (counts[u] !== undefined) counts[u]++;
    });
    return counts;
  }, [unassignedTasks]);

  const urgencyFilterOptions = [
    { key: 'all', label: 'All' },
    { key: 'urgent', label: 'Urgent' },
    { key: 'standard', label: 'Standard' },
    { key: 'low', label: 'Low' }
  ];

  const specialArrangementsList = useMemo(() => {
    if (!selectedIssueForDetails?.specialArrangements) return [];
    return Object.entries(SPECIAL_ARRANGEMENT_LABELS)
      .filter(([key]) => selectedIssueForDetails.specialArrangements[key])
      .map(([, label]) => label);
  }, [selectedIssueForDetails]);

  const canAssign = selectedTaskIds.length === 1 && selectedStaffId && scheduledStartDate;

  return (
    <div className="min-h-screen bg-[#F3F4F8] text-[#1D1D2C] flex">
      <AdminSidebar active="staff" profileName={profileName} />

      <main className="flex-1 px-6 py-5 pb-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin-dashboard')} className="w-7 h-7 rounded-md border border-[#DCE0EE] text-[#596080] bg-white">←</button>
            <h1 className="text-[20px] font-semibold text-[#20253A]">Assign Unassigned Tasks</h1>
          </div>
          <button onClick={() => navigate('/admin-dashboard')} className="px-3 py-1.5 rounded-md bg-[#E8EAF5] text-[11px] font-semibold text-[#2E3348]">Back to Dashboard</button>
        </div>

        <div className="bg-[#F7F8FC] border border-[#E2E6F2] rounded-lg p-4">
          <h2 className="text-[22px] font-semibold text-[#1F2233]">Task Assignment Workspace</h2>
          <p className="text-[12px] text-[#6774A9] mt-1">Select one task, review all issue details, choose a staff member and set a scheduled start date.</p>

          {/* ── Main 3-column workspace ── */}
          <div className="grid grid-cols-[1fr_1.4fr_1fr] gap-4 mt-4">

            {/* Column 1: Task list */}
            <section className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[15px] font-semibold text-[#1F2233]">
                  Unassigned Tasks
                  <span className="text-[10px] align-middle bg-[#E9EDFF] text-[#4D5CD9] px-2 py-0.5 rounded-full ml-1">
                    {filteredTasks.length} Pending
                  </span>
                </p>
              </div>
              <div className="flex gap-1.5 mb-2 flex-wrap">
                {urgencyFilterOptions.map(({ key, label }) => {
                  const active = urgencyFilter === key;
                  const count = urgencyCounts[key] ?? 0;
                  const activeStyle =
                    key === 'urgent' ? 'bg-[#F0642A] text-white border-[#F0642A]' :
                    key === 'standard' ? 'bg-[#3D7BEE] text-white border-[#3D7BEE]' :
                    key === 'low' ? 'bg-[#596080] text-white border-[#596080]' :
                    'bg-[#3346F2] text-white border-[#3346F2]';
                  return (
                    <button key={key} type="button" onClick={() => setUrgencyFilter(key)}
                      className={`text-[10px] px-2.5 py-1 rounded-full font-semibold border transition ${active ? activeStyle : 'bg-white border-[#DDE2F0] text-[#596080]'}`}>
                      {label} <span className="opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>
              <div className="space-y-2 flex-1 overflow-y-auto max-h-[460px] pr-0.5">
                {filteredTasks.length === 0 ? (
                  <div className="bg-white rounded-lg border border-[#DDE2F0] p-4 text-[12px] text-[#7681A8]">
                    {urgencyFilter === 'all' ? 'No unassigned tasks.' : `No ${URGENCY_DISPLAY[urgencyFilter]?.toLowerCase()} urgency tasks.`}
                  </div>
                ) : (
                  filteredTasks.map((task) => {
                    const selected = selectedTaskIds.includes(task._id);
                    const urgency = task.urgency || 'standard';
                    return (
                      <button key={task._id} type="button" onClick={() => toggleTask(task._id, task)}
                        className={`w-full bg-white rounded-lg border p-3 text-left transition ${selected ? 'border-[#3346F2] ring-1 ring-[#3346F2]' : 'border-[#DDE2F0] hover:border-[#3346F2]/40'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0">
                            <span className={`w-4 h-4 mt-0.5 rounded border shrink-0 flex items-center justify-center text-[10px] text-white ${selected ? 'bg-[#3346F2] border-[#3346F2]' : 'border-[#CCD2E4] bg-white'}`}>
                              {selected ? '✓' : ''}
                            </span>
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-[#1F2233] truncate">{formatIssueTitle(task)}</p>
                              <p className="text-[11px] text-[#6A75A7] mt-0.5 truncate">{formatTaskMeta(task)}</p>
                            </div>
                          </div>
                          <span className={`text-[9px] px-2 py-0.5 rounded font-semibold uppercase shrink-0 ${URGENCY_STYLES[urgency]}`}>
                            {URGENCY_DISPLAY[urgency]}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </section>

            {/* Column 2: Full issue details (expanded, scrollable, with media) */}
            <section className="bg-white rounded-lg border border-[#DDE2F0] flex flex-col overflow-hidden" style={{ maxHeight: '560px' }}>
              {selectedIssueForDetails ? (
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="px-4 pt-4 pb-3 border-b border-[#EEF0F6] shrink-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] text-[#7681A8] font-semibold uppercase tracking-wide">Issue Details</p>
                        <p className="text-[15px] font-semibold text-[#1F2233] mt-0.5">
                          {ISSUE_LABELS[selectedIssueForDetails.issueType] || selectedIssueForDetails.issueType}
                        </p>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded font-semibold uppercase shrink-0 ${URGENCY_STYLES[selectedIssueForDetails.urgency || 'standard']}`}>
                        {URGENCY_DISPLAY[selectedIssueForDetails.urgency] || 'Standard'}
                      </span>
                    </div>
                  </div>

                  {/* Scrollable body */}
                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-[12px]">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#F8F9FC] rounded-lg p-2.5">
                        <p className="text-[10px] text-[#7681A8] font-semibold uppercase">Location</p>
                        <p className="font-semibold text-[#1F2233] mt-0.5">
                          {selectedIssueForDetails.building?.name || '—'}
                        </p>
                        <p className="text-[11px] text-[#6A75A7]">
                          Floor {selectedIssueForDetails.floor} • Unit {selectedIssueForDetails.unit}
                        </p>
                      </div>
                      <div className="bg-[#F8F9FC] rounded-lg p-2.5">
                        <p className="text-[10px] text-[#7681A8] font-semibold uppercase">Specific Spot</p>
                        <p className="font-semibold text-[#1F2233] mt-0.5">
                          {selectedIssueForDetails.specificSpot || '—'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#F8F9FC] rounded-lg p-2.5">
                        <p className="text-[10px] text-[#7681A8] font-semibold uppercase">Tenant</p>
                        <p className="font-semibold text-[#1F2233] mt-0.5">{selectedIssueForDetails.tenant?.name || '—'}</p>
                        <p className="text-[11px] text-[#6A75A7]">{selectedIssueForDetails.tenant?.email || ''}</p>
                      </div>
                      <div className="bg-[#F8F9FC] rounded-lg p-2.5">
                        <p className="text-[10px] text-[#7681A8] font-semibold uppercase">Priority</p>
                        <p className="font-semibold capitalize text-[#1F2233] mt-0.5">{selectedIssueForDetails.priority || 'medium'}</p>
                        <p className="text-[11px] text-[#6A75A7]">
                          Reported {new Date(selectedIssueForDetails.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#F8F9FC] rounded-lg p-2.5">
                      <p className="text-[10px] text-[#7681A8] font-semibold uppercase mb-1">Description</p>
                      <p className="text-[#1F2233] leading-relaxed">
                        {selectedIssueForDetails.description || 'No description provided.'}
                      </p>
                    </div>

                    {specialArrangementsList.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                        <p className="text-[10px] text-amber-700 font-semibold uppercase mb-1">⚠ Special Arrangements</p>
                        <ul className="space-y-0.5">
                          {specialArrangementsList.map((label) => (
                            <li key={label} className="text-[11px] text-amber-800">• {label}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Media attachments — fully visible */}
                    <div>
                      <p className="text-[10px] text-[#7681A8] font-semibold uppercase mb-2">
                        Attachments ({selectedIssueForDetails.media?.length || 0})
                      </p>
                      <IssueMediaGallery media={selectedIssueForDetails.media || []} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-[#7681A8] p-6">
                  <span className="text-3xl">📋</span>
                  <p className="text-[13px] font-semibold">No task selected</p>
                  <p className="text-[11px] text-center">Click any task on the left to see full details here, including photos and description.</p>
                </div>
              )}
            </section>

            {/* Column 3: Staff + scheduled start (prominent) */}
            <section className="flex flex-col gap-3">
              {/* ── Scheduled Start — top of right column, always visible ── */}
              <div className={`rounded-lg border-2 p-3 ${dateError ? 'border-[#F0642A] bg-[#FFF5F5]' : 'border-[#3346F2] bg-[#EDF0FF]'}`}>
                <p className="text-[13px] font-bold text-[#3346F2] mb-2">📅 Scheduled Start Date</p>
                <div className="flex gap-2 flex-wrap">
                  <div className="flex flex-col gap-0.5 flex-1 min-w-[100px]">
                    <label className="text-[11px] font-semibold text-[#3346F2]">
                      Date <span className="text-[#F0642A]">*</span>
                    </label>
                    <input
                      type="date"
                      min={todayStr()}
                      value={scheduledStartDate}
                      onChange={(e) => { setScheduledStartDate(e.target.value); setDateError(''); }}
                      className={`text-[12px] border-2 rounded-md px-2 py-1.5 text-[#1F2233] bg-white focus:outline-none focus:ring-2 focus:ring-[#3346F2] font-medium ${dateError ? 'border-[#F0642A]' : 'border-[#3346F2]/40'}`}
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 flex-1 min-w-[90px]">
                    <label className="text-[11px] font-semibold text-[#3346F2]">Time <span className="text-[#9CA3B8] font-normal">(opt.)</span></label>
                    <input
                      type="time"
                      value={scheduledStartTime}
                      onChange={(e) => setScheduledStartTime(e.target.value)}
                      className="text-[12px] border-2 border-[#3346F2]/40 rounded-md px-2 py-1.5 text-[#1F2233] bg-white focus:outline-none focus:ring-2 focus:ring-[#3346F2]"
                    />
                  </div>
                </div>
                {dateError ? (
                  <p className="text-[11px] text-[#F0642A] font-semibold mt-1.5">⚠ {dateError}</p>
                ) : (
                  <p className="text-[10px] text-[#596080] mt-1.5">
                    Staff will be reminded if work hasn't started by this date.
                  </p>
                )}
              </div>

              {/* ── Staff list ── */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[15px] font-semibold text-[#1F2233]">Suitable Staff</p>
                  <button
                    onClick={() => setFilterBySkill(!filterBySkill)}
                    className={`text-[10px] px-2 py-1 rounded font-semibold transition ${filterBySkill ? 'bg-[#3346F2] text-white' : 'bg-[#E8EAF5] text-[#2E3348]'}`}
                    title="Toggle skill-based filtering"
                  >
                    {filterBySkill ? '🔽 Skills' : '⊖ All'}
                  </button>
                </div>
                <div className="space-y-2 overflow-y-auto max-h-[310px]">
                  {filteredStaffMembers.length === 0 ? (
                    <div className="bg-white rounded-lg border border-[#DDE2F0] p-4 text-[12px] text-[#7681A8]">
                      {filterBySkill && selectedIssueForDetails
                        ? `No ${ISSUE_LABELS[selectedIssueForDetails.issueType]?.toLowerCase()} specialists available.`
                        : 'No approved staff available.'}
                    </div>
                  ) : (
                    filteredStaffMembers.map((staff) => {
                      const selected = selectedStaffId === staff._id;
                      const activeTasks = staffTaskCounts[staff._id] || 0;
                      const dept = staff.primaryDepartment || staff.staffType || 'General Maintenance';
                      const statusLabel = staff.workStatus === 'on-call' ? 'On-call' : 'Available';
                      return (
                        <button key={staff._id} type="button" onClick={() => setSelectedStaffId(staff._id)}
                          className={`w-full bg-white rounded-lg border p-3 text-left transition ${selected ? 'border-[#3346F2] ring-1 ring-[#3346F2]' : 'border-[#DDE2F0] hover:border-[#3346F2]/40'}`}>
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-[#F6D4A7] text-[#2E3348] text-[11px] font-semibold flex items-center justify-center shrink-0">
                              {getInitials(staff.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-semibold text-[#1F2233] truncate">{staff.name}</p>
                              <p className="text-[11px] text-[#6A75A7] truncate">{dept}</p>
                              <p className="text-[10px] text-[#596080]">
                                <span className="text-[#24A35A]">• {statusLabel}</span> • {activeTasks} active
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* ── Assign action ── */}
              <div className="border-t border-[#E2E6F2] pt-3 mt-1">
                <div className="text-[11px] text-[#596080] mb-2 space-y-0.5">
                  <p><span className="font-semibold text-[#2A2E3F]">Task:</span> {selectedTaskIds.length === 1 ? `${formatIssueTitle(filteredTasks.find(t => t._id === selectedTaskIds[0]) || {})}` : 'None selected'}</p>
                  <p><span className="font-semibold text-[#2A2E3F]">Staff:</span> {selectedStaff ? selectedStaff.name : 'None selected'}</p>
                  <p><span className="font-semibold text-[#2A2E3F]">Start:</span> {scheduledStartDate ? `${scheduledStartDate}${scheduledStartTime ? ` ${scheduledStartTime}` : ''}` : 'Not set'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={clearSelection} className="flex-1 py-2 rounded-md border border-[#DDE2F0] text-[12px] font-semibold text-[#5D68A7] bg-white hover:bg-[#F6F7FB] transition">
                    Clear
                  </button>
                  <button
                    onClick={handleAssign}
                    disabled={assigning || !canAssign}
                    className="flex-1 py-2 rounded-md bg-[#3346F2] text-white text-[12px] font-semibold disabled:opacity-40 transition hover:bg-[#2234D0]"
                  >
                    {assigning ? 'Assigning…' : 'Assign Task'}
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
