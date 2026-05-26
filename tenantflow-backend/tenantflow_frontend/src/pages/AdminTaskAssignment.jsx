import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, issueAPI } from '../api';
import AdminSidebar from '../components/AdminSidebar';

const ISSUE_LABELS = {
  plumbing: 'Plumbing Issue',
  electrical: 'Electrical Issue',
  cleaning: 'Cleaning Task',
  carpentry: 'Carpentry Task',
  other: 'General Maintenance'
};

const PRIORITY_STYLES = {
  high: 'bg-[#FFEDE7] text-[#F0642A]',
  medium: 'bg-[#EAF2FF] text-[#3D7BEE]',
  low: 'bg-[#EEF1F6] text-[#596080]'
};

export default function AdminTaskAssignment() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const [profileName, setProfileName] = useState('Property Manager');
  const [issues, setIssues] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [assigning, setAssigning] = useState(false);

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

  const unassignedTasks = useMemo(
    () => issues.filter((issue) => !issue.assignedTo && issue.status === 'new'),
    [issues]
  );

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

  const formatIssueTitle = (issue) => {
    const label = ISSUE_LABELS[issue.issueType] || 'Maintenance Task';
    return `${label}`;
  };

  const formatTaskMeta = (issue) => {
    const unit = issue.unitNumber ? `Apt ${issue.unitNumber}` : 'Apt N/A';
    const minutesAgo = Math.max(1, Math.floor((Date.now() - new Date(issue.createdAt).getTime()) / 60000));
    return `${unit} • Reported ${minutesAgo}m ago`;
  };

  const toggleTask = (taskId) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const selectAllTasks = () => {
    setSelectedTaskIds(unassignedTasks.map((task) => task._id));
  };

  const clearSelection = () => {
    setSelectedTaskIds([]);
    setSelectedStaffId('');
  };

  const handleAssign = async () => {
    if (!selectedStaffId || selectedTaskIds.length === 0) {
      return;
    }

    const assignedIds = [...selectedTaskIds];
    setAssigning(true);
    try {
      await Promise.all(
        assignedIds.map((taskId) =>
          issueAPI.update(taskId, {
            assignedTo: selectedStaffId,
          })
        )
      );

      const refreshedIssues = await issueAPI.getAll({ status: 'all' });
      setIssues(refreshedIssues?.data?.issues || []);
      clearSelection();
      navigate('/admin/in-progress-repairs', {
        state: {
          highlightedTaskIds: assignedIds
        }
      });
    } catch {
      // keep current state for retry
    } finally {
      setAssigning(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'ST';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  };

  return (
    <div className="min-h-screen bg-[#F3F4F8] text-[#1D1D2C] flex">
      <AdminSidebar active="staff" profileName={profileName} />

      <main className="flex-1 px-6 py-5 pb-24">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin-dashboard')} className="w-7 h-7 rounded-md border border-[#DCE0EE] text-[#596080] bg-white">←</button>
            <h1 className="text-[20px] font-semibold text-[#20253A]">Assign Unassigned Tasks</h1>
          </div>
          <button onClick={() => navigate('/admin-dashboard')} className="px-3 py-1.5 rounded-md bg-[#E8EAF5] text-[11px] font-semibold text-[#2E3348]">Back to Dashboard</button>
        </div>

        <div className="bg-[#F7F8FC] border border-[#E2E6F2] rounded-lg p-4">
          <h2 className="text-[24px] font-semibold text-[#1F2233]">Task Assignment Workspace</h2>
          <p className="text-[12px] text-[#6774A9] mt-1">Select tasks from the left and an available staff member on the right to perform bulk assignment.</p>

          <div className="grid grid-cols-[1.25fr_0.85fr] gap-4 mt-5">
            <section>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[18px] font-semibold text-[#1F2233]">Unassigned Tasks <span className="text-[10px] align-middle bg-[#E9EDFF] text-[#4D5CD9] px-2 py-0.5 rounded-full ml-1">{unassignedTasks.length} Pending</span></p>
                <button onClick={selectAllTasks} className="text-[11px] text-[#3346F2] font-semibold">Select All</button>
              </div>

              <div className="space-y-2">
                {unassignedTasks.length === 0 ? (
                  <div className="bg-white rounded-lg border border-[#DDE2F0] p-4 text-[12px] text-[#7681A8]">No unassigned tasks found.</div>
                ) : (
                  unassignedTasks.map((task) => {
                    const selected = selectedTaskIds.includes(task._id);
                    const priority = task.priority || 'medium';
                    return (
                      <button
                        key={task._id}
                        type="button"
                        onClick={() => toggleTask(task._id)}
                        className={`w-full bg-white rounded-lg border p-3 text-left transition ${selected ? 'border-[#3346F2] ring-1 ring-[#3346F2]' : 'border-[#DDE2F0]'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2 min-w-0">
                            <span className={`w-4 h-4 mt-0.5 rounded border ${selected ? 'bg-[#3346F2] border-[#3346F2]' : 'border-[#CCD2E4] bg-white'} text-white text-[10px] flex items-center justify-center`}>{selected ? '✓' : ''}</span>
                            <div className="min-w-0">
                              <p className="text-[14px] font-semibold text-[#1F2233] truncate">{formatIssueTitle(task)}</p>
                              <p className="text-[11px] text-[#6A75A7] mt-1 truncate">{formatTaskMeta(task)}</p>
                            </div>
                          </div>
                          <span className={`text-[9px] px-2 py-0.5 rounded font-semibold uppercase ${PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium}`}>{priority}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[18px] font-semibold text-[#1F2233]">Available Staff</p>
                <span className="text-[10px] bg-[#E6F7EC] text-[#24A35A] px-2 py-0.5 rounded-full">• Online</span>
              </div>

              <div className="space-y-2">
                {staffMembers.length === 0 ? (
                  <div className="bg-white rounded-lg border border-[#DDE2F0] p-4 text-[12px] text-[#7681A8]">No approved staff available.</div>
                ) : (
                  staffMembers.map((staff) => {
                    const selected = selectedStaffId === staff._id;
                    const activeTasks = staffTaskCounts[staff._id] || 0;
                    const dept = staff.primaryDepartment || staff.staffType || 'General Maintenance';
                    const statusLabel = staff.workStatus === 'on-call' ? 'On-call' : 'Available';

                    return (
                      <button
                        key={staff._id}
                        type="button"
                        onClick={() => setSelectedStaffId(staff._id)}
                        className={`w-full bg-white rounded-lg border p-3 text-left transition ${selected ? 'border-[#3346F2] ring-1 ring-[#3346F2]' : 'border-[#DDE2F0]'}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-full bg-[#F6D4A7] text-[#2E3348] text-[11px] font-semibold flex items-center justify-center">{getInitials(staff.name)}</div>
                          <div className="min-w-0">
                            <p className="text-[14px] font-semibold text-[#1F2233] truncate">{staff.name}</p>
                            <p className="text-[11px] text-[#6A75A7] truncate">{dept} • <span className="text-[#24A35A]">{statusLabel}</span></p>
                            <p className="text-[10px] text-[#596080] mt-0.5">{activeTasks} active tasks</p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      <div className="fixed left-[180px] right-0 bottom-0 bg-white border-t border-[#E1E5F2] px-6 py-4 flex items-center justify-between z-40">
        <div className="text-[12px] text-[#596080]">
          <p><span className="font-semibold text-[#2A2E3F]">Selected Task:</span> {selectedTaskIds.length} task(s)</p>
          <p><span className="font-semibold text-[#2A2E3F]">Assigned To:</span> {selectedStaff ? selectedStaff.name : 'No staff selected'}</p>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={clearSelection} className="text-[12px] text-[#5D68A7] font-semibold">Cancel Selection</button>
          <button
            onClick={handleAssign}
            disabled={assigning || !selectedStaffId || selectedTaskIds.length === 0}
            className="px-5 py-2 rounded-md bg-[#3346F2] text-white text-[12px] font-semibold disabled:opacity-50"
          >
            {assigning ? 'Assigning...' : 'Assign Task(s)'}
          </button>
        </div>
      </div>
    </div>
  );
}
