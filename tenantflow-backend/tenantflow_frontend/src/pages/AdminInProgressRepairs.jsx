import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAPI, issueAPI } from '../api';
import AdminSidebar from '../components/AdminSidebar';
import usePolling from '../hooks/usePolling';
import { formatStatusLabel, getStatusBadgeTheme } from '../utils/issueStatus';

const STATUS_FILTERS = [
  'all',
  'new',
  'assigned',
  'in progress',
  'completed',
  'cost report submitted',
  'cost report rejected',
  'invoice issued',
  'done and payment pending',
  'payment done',
  'task done',
];

export default function AdminInProgressRepairs() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem('role');
  const [userName, setUserName] = useState('Property Manager');
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const getBuildingLabel = (value) => {
    if (!value) return '-';
    if (typeof value === 'string') return value;
    return value.name || '-';
  };

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/login', { state: { role: 'admin' } });
      return;
    }

    const loadData = async () => {
      try {
        const profileResponse = await authAPI.getProfile();
        if (profileResponse?.data?.user?.name) {
          setUserName(profileResponse.data.user.name);
        }

        const issueResponse = await issueAPI.getAll({ status: 'all' });
        const list = issueResponse?.data?.issues || [];
        setRepairs(list);
      } catch {
        setRepairs([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [role, navigate]);

  const refreshRepairs = useCallback(async () => {
    if (role !== 'admin') return;
    try {
      const issueResponse = await issueAPI.getAll({ status: 'all' });
      const list = issueResponse?.data?.issues || [];
      setRepairs(list);
    } catch {
      setRepairs([]);
    }
  }, [role]);

  usePolling(refreshRepairs, 5000, role === 'admin');

  const filteredRepairs = useMemo(() => {
    let result = repairs;

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter((item) => item.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((item) => {
        const issueType = (item.issueType || '').toLowerCase();
        const building = getBuildingLabel(item.building).toLowerCase();
        const unit = (item.unit || item.unitNumber || '').toLowerCase();
        const staff = (item.assignedTo?.name || '').toLowerCase();
        const description = (item.description || '').toLowerCase();
        return issueType.includes(term) || building.includes(term) || unit.includes(term) || staff.includes(term) || description.includes(term);
      });
    }

    return result;
  }, [repairs, searchTerm, statusFilter]);

  const highlightedTaskIds = useMemo(
    () => new Set(location.state?.highlightedTaskIds || []),
    [location.state]
  );

  const orderedRepairs = useMemo(() => {
    if (highlightedTaskIds.size === 0) {
      return filteredRepairs;
    }

    return [...filteredRepairs].sort((a, b) => {
      const aHighlighted = highlightedTaskIds.has(a._id) ? 1 : 0;
      const bHighlighted = highlightedTaskIds.has(b._id) ? 1 : 0;
      return bHighlighted - aHighlighted;
    });
  }, [filteredRepairs, highlightedTaskIds]);

  const toTaskId = (id, index) => {
    if (!id) return `#TASK-${4020 + index}`;
    return `#TASK-${id.toString().slice(-4).toUpperCase()}`;
  };

  const toIssueTitle = (issueType) => {
    if (!issueType) return 'Maintenance Repair';
    return `${issueType.charAt(0).toUpperCase()}${issueType.slice(1)} Repair`;
  };

  const toDateTime = (dateValue) => {
    if (!dateValue) return '-';
    const date = new Date(dateValue);
    return date.toLocaleString([], {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const recentUpdates = useMemo(
    () =>
      [...repairs]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
        .slice(0, 8),
    [repairs]
  );

  const statusLabel = (status) => formatStatusLabel(status);

  return (
    <div className="min-h-screen bg-[#F3F4F8] text-[#1D1D2C] flex">
      <AdminSidebar active="repairs" profileName={userName} />

      <main className="flex-1 px-5 py-5">
        <div className="bg-[#F3F4F8] rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3">
              <button onClick={() => navigate('/admin-dashboard')} className="mt-1 w-7 h-7 rounded-md border border-[#DCE0EE] text-[#596080] bg-white">←</button>
              <div>
                <h1 className="text-[38px] leading-9 font-semibold text-[#20253A]">Tasks List</h1>
                <p className="text-[12px] text-[#7681A8] mt-1">Managing active maintenance tasks across all properties</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => setShowNotifications((prev) => !prev)}
                className="w-8 h-8 rounded-md border border-[#E2E6F2] bg-white text-[#5E6686]"
              >
                🔔
              </button>
              {showNotifications && (
                <div className="absolute right-5 mt-72 w-80 bg-white border border-[#E2E6F2] rounded-lg shadow z-50 overflow-hidden">
                  <div className="px-3 py-2 text-[11px] font-semibold text-[#596080] border-b border-[#EEF0F6]">Recent Repairs Updates</div>
                  {recentUpdates.length === 0 ? (
                    <div className="px-3 py-4 text-[11px] text-[#7681A8]">No updates yet.</div>
                  ) : (
                    recentUpdates.map((repair) => (
                      <div key={repair._id} className="px-3 py-2 border-b border-[#EEF0F6]">
                        <p className="text-[11px] font-semibold text-[#20253A]">{toIssueTitle(repair.issueType)} • {[getBuildingLabel(repair.building), repair.unit || repair.unitNumber].filter(Boolean).join(' - ')}</p>
                        <p className="text-[10px] text-[#7681A8] mt-0.5">Status: {statusLabel(repair.status)}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
              <div className="w-8 h-8 rounded-full border-2 border-[#3346F2] bg-[#F6D4A7] flex items-center justify-center text-[11px] font-bold text-[#2E3348]">
                {(userName || 'P').charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          <div className="flex gap-2 mb-3">
            <div className="relative flex-1 flex items-center gap-2 px-3 h-8 rounded border border-[#DDE2F0] bg-white">
              <svg className="w-4 h-4 text-[#7079A3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by issue type, location, staff..."
                className="flex-1 h-full text-[11px] bg-transparent outline-none"
              />
              <button
                type="button"
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="inline-flex items-center gap-2 h-6 px-3 text-[11px] rounded-full border border-[#DDE2F0] bg-[#F7F8FC] hover:bg-[#EEF2FF] font-medium text-[#2E3348] shrink-0"
              >
                <svg className="w-3.5 h-3.5 text-[#3346F2]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h18l-7 8v5l-4 2v-7L3 5z" />
                </svg>
                <span>{statusFilter === 'all' ? 'All Status' : formatStatusLabel(statusFilter)}</span>
              </button>
              {showStatusMenu && (
                <div className="absolute right-2 top-[calc(100%+6px)] w-56 bg-white border border-[#DDE2F0] rounded-lg shadow-lg z-40 overflow-hidden">
                  {STATUS_FILTERS.map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setStatusFilter(status);
                        setShowStatusMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-[11px] hover:bg-[#F6F7FB] ${
                        statusFilter === status ? 'bg-[#EAF2FF] text-[#3346F2] font-semibold' : 'text-[#2E3348]'
                      }`}
                    >
                      {status === 'all' ? 'All Status' : formatStatusLabel(status)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[#DDE2F0] overflow-hidden">
            {highlightedTaskIds.size > 0 && (
              <div className="px-4 py-2 text-[11px] bg-[#EDF1FF] text-[#3346F2] border-b border-[#DDE2F0]">
                Newly assigned tasks are shown at the top.
              </div>
            )}
            <div className="grid grid-cols-6 px-4 py-2 text-[10px] font-semibold text-[#7079A3] bg-[#F7F8FC] border-b border-[#ECEFF7]">
              <span>TASK ID</span>
              <span>ISSUE TITLE</span>
              <span>ASSIGNED STAFF</span>
              <span>LOCATION</span>
              <span>START DATE/TIME</span>
              <span>STATUS</span>
            </div>

            {loading ? (
              <div className="px-4 py-8 text-[12px] text-[#7079A3]">Loading repairs...</div>
            ) : orderedRepairs.length === 0 ? (
              <div className="px-4 py-8 text-[12px] text-[#7079A3]">No active repairs found.</div>
            ) : (
              orderedRepairs.map((repair, index) => (
                <div key={repair._id || index} className="grid grid-cols-6 items-center px-4 py-2.5 text-[11px] border-b last:border-b-0 border-[#ECEFF7]">
                  <span className="text-[#3346F2] font-semibold">{toTaskId(repair._id, index)}</span>
                  <span>{toIssueTitle(repair.issueType)}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#F6D4A7] text-[#2E3348] text-[9px] flex items-center justify-center">
                      {(repair.assignedTo?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span>{repair.assignedTo?.name || 'Unassigned'}</span>
                  </div>
                  <span className="text-[#5D68A7]">{[getBuildingLabel(repair.building), repair.unit || repair.unitNumber].filter(Boolean).join(' - ') || '-'}</span>
                  <span className="text-[#5D68A7]">{toDateTime(repair.updatedAt || repair.createdAt)}</span>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center justify-center min-w-[8.5rem] px-3.5 py-1 rounded-full whitespace-nowrap text-[10px] font-bold ${getStatusBadgeTheme(repair.status, 'pill').className}`}>
                      {getStatusBadgeTheme(repair.status, 'pill').text}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/in-progress-repairs/${repair._id}`)}
                      className="text-[10px] font-semibold text-[#3346F2] hover:text-[#1F3DDB] hover:underline whitespace-nowrap"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))
            )}

            <div className="flex items-center justify-between px-4 py-2 border-t border-[#ECEFF7] text-[10px] text-[#7079A3]">
              <span>Showing {orderedRepairs.length} of {repairs.length} repairs</span>
              <div className="flex gap-1">
                <button className="px-2 py-1 border border-[#DDE2F0] rounded bg-white">Previous</button>
                <button className="px-2 py-1 border border-[#DDE2F0] rounded bg-white">Next</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
