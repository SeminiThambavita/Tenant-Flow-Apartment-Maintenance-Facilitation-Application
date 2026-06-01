import { useLocation, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { authAPI, invoiceAPI, issueAPI, paymentAPI } from '../api';
import Logo from '../components/Logo';
import IssueMediaGallery from '../components/IssueMediaGallery';
import ProfileDropdown from '../components/ProfileDropdown';
import usePolling from '../hooks/usePolling';
import { formatStatusLabel, getStatusBadgeTheme, isCompletedStatus, isOpenStatus, normalizeStatus } from '../utils/issueStatus';
import { addNotification, getNotifications, markNotificationRead } from '../utils/notifications';
import { getUserProfileImage } from '../utils/profileImage';

const getBuildingLabel = (building) => {
  if (!building) return '—';
  if (typeof building === 'string') return building;
  return building.name || building.address || '—';
};

const getIssueLabel = (invoice) => {
  const issue = invoice.issue;
  const type = issue?.issueType || invoice.issueType || 'Maintenance';
  const spot = issue?.specificSpot || issue?.description || '';
  return spot ? `${type} - ${spot}` : type;
};

const normalizeInvoice = (invoice) => ({
  ...invoice,
  locationLabel: `${getBuildingLabel(invoice.location?.building || invoice.issue?.building)} , Unit ${invoice.location?.unitNumber || invoice.issue?.unitNumber || invoice.issue?.unit || '—'}`.replace(' ,', ','),
  relatedIssueLabel: getIssueLabel(invoice),
  location: {
    ...invoice.location,
    building: getBuildingLabel(invoice.location?.building),
    unitNumber: invoice.location?.unitNumber || invoice.issue?.unitNumber || invoice.issue?.unit || '—'
  }
});

const REQUEST_STATUS_FLOW = [
  { value: 'new', label: 'New', dot: 'bg-blue-600', bar: 'bg-blue-500' },
  { value: 'assigned', label: 'Assigned', dot: 'bg-blue-600', bar: 'bg-blue-500' },
  { value: 'in progress', label: 'In Progress', dot: 'bg-emerald-600', bar: 'bg-emerald-500' },
  { value: 'completed', label: 'Completed', dot: 'bg-amber-500', bar: 'bg-amber-400' },
  { value: 'cost report submitted', label: 'Cost Report Submitted', dot: 'bg-violet-600', bar: 'bg-violet-500' },
  { value: 'invoice issued', label: 'Invoice Issued', dot: 'bg-sky-600', bar: 'bg-sky-500' },
  { value: 'payment done', label: 'Payment Done', dot: 'bg-emerald-600', bar: 'bg-emerald-500' },
  { value: 'task done', label: 'Task Done', dot: 'bg-teal-600', bar: 'bg-teal-500' },
];

const buildRequestTimeline = (issue) => {
  const currentStatus = normalizeStatus(issue?.status || 'new');
  const historyEntries = Array.isArray(issue?.statusHistory) ? issue.statusHistory : [];
  const historyMap = new Map();

  historyEntries.forEach((entry) => {
    const normalized = normalizeStatus(entry.status);
    if (!normalized) return;
    historyMap.set(normalized, entry);
  });

  const currentIndex = REQUEST_STATUS_FLOW.findIndex((item) => item.value === currentStatus);

  return REQUEST_STATUS_FLOW.map((step, index) => {
    const historyEntry = historyMap.get(step.value);
    const reached = currentIndex >= 0 ? index <= currentIndex : Boolean(historyEntry) || step.value === currentStatus;
    const active = step.value === currentStatus;

    return {
      ...step,
      reached,
      active,
      timestamp: historyEntry?.changedAt || (active ? issue?.updatedAt || issue?.createdAt : null),
      reason: historyEntry?.reason || '',
    };
  });
};

export default function TenantDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem('role');
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [userName, setUserName] = useState('Tenant');
  const [userInitials, setUserInitials] = useState('T');
  const [profileImage, setProfileImage] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');
  const [issues, setIssues] = useState([]);
  const [issueLoading, setIssueLoading] = useState(false);
  const [issueError, setIssueError] = useState('');
  const [payments, setPayments] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [deletingPaymentId, setDeletingPaymentId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingInvoiceToOpen, setPendingInvoiceToOpen] = useState(null);

  const applyPaidOverrides = (invoiceList) => {
    const paidIds = JSON.parse(localStorage.getItem('paidInvoiceIds') || '[]');
    if (!Array.isArray(paidIds) || paidIds.length === 0) {
      return invoiceList;
    }

    return invoiceList.map((invoice) =>
      paidIds.includes(invoice._id)
        ? { ...invoice, status: 'paid' }
        : invoice
    );
  };

  useEffect(() => {
    if (role !== 'tenant') {
      navigate('/login');
    }
  }, [role, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const menu = params.get('menu');
    const invoiceId = params.get('invoiceId');

    if (menu) {
      setActiveMenu(menu);
    }

    if (invoiceId) {
      setPendingInvoiceToOpen(invoiceId);
    }
  }, [location.search]);

  useEffect(() => {
    setNotifications(getNotifications());
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      try {
        const response = await authAPI.getProfile();
        if (isActive && response?.data?.user?.name) {
          const name = response.data.user.name;
          const user = response.data.user;
          setUserName(name);
          setUserInitials(
            name
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0].toUpperCase())
              .join('') || 'T'
          );
          setProfileImage(getUserProfileImage(user));
        }
      } catch {
        if (isActive) {
          setUserName('Tenant');
          setProfileImage('');
        }
      }
    };

    if (role === 'tenant') {
      loadProfile();
    }

    return () => {
      isActive = false;
    };
  }, [role]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    navigate('/role-selection');
  };

  const issueTypeLabelMap = {
    plumbing: 'Plumbing',
    electrical: 'Electrical',
    cleaning: 'Cleaning',
    carpentry: 'Carpentry',
    other: 'Other',
  };

  const priorityLabelMap = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  const isSameDay = (value) => {
    if (!value) {
      return false;
    }
    const date = new Date(value);
    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  };

  const formatIssueId = (issueId) => `#${issueId.slice(-6).toUpperCase()}`;

  const getBuildingLabel = (value) => {
    if (!value) return 'N/A';
    if (typeof value === 'string') return value;
    return value.name || 'N/A';
  };

  const formatIssueDate = (dateValue) => {
    if (!dateValue) {
      return '-';
    }
    return new Date(dateValue).toLocaleDateString();
  };

  const pendingInvoices = invoices
    .filter((invoice) => ['submitted', 'pending', 'overdue'].includes(String(invoice.status || '').toLowerCase()))
    .sort((left, right) => {
      const statusOrder = { overdue: 0, pending: 1, submitted: 2 };
      const leftStatus = String(left.status || '').toLowerCase();
      const rightStatus = String(right.status || '').toLowerCase();
      const orderDiff = (statusOrder[leftStatus] ?? 99) - (statusOrder[rightStatus] ?? 99);
      if (orderDiff !== 0) {
        return orderDiff;
      }

      return new Date(left.dueDate || left.issuedAt || 0) - new Date(right.dueDate || right.issuedAt || 0);
    });

  const openPaymentPage = (invoice) => {
    if (!invoice?._id) {
      return;
    }

    localStorage.setItem('pendingInvoiceId', invoice._id);
    localStorage.setItem('pendingInvoiceLabel', invoice.invoiceNumber || invoice.issueTitle || 'Maintenance Payment');
    setSelectedInvoice(null);
    navigate('/payment', { state: { invoice } });
  };

  const fetchInvoices = async () => {
    setInvoiceLoading(true);
    setInvoiceError('');
    try {
      const response = await invoiceAPI.getAll();
      const fetchedInvoices = response.data.invoices || [];
      setInvoices(applyPaidOverrides(fetchedInvoices.map(normalizeInvoice)));
    } catch (err) {
      setInvoiceError('Failed to load invoices.');
      setInvoices([]);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const fetchIssues = useCallback(async () => {
    setIssueLoading(true);
    setIssueError('');
    try {
      const response = await issueAPI.getAll();
      const fetchedIssues = response.data.issues || [];
      setIssues(fetchedIssues);

      if (selectedRequest?.raw?._id) {
        const refreshed = fetchedIssues.find((item) => item._id === selectedRequest.raw._id);
        if (refreshed) {
          const statusKey = refreshed.status || 'new';
          setSelectedRequest({
            id: formatIssueId(refreshed._id),
            issue: issueTypeLabelMap[refreshed.issueType] || refreshed.issueType || 'Maintenance',
            urgency: priorityLabelMap[refreshed.priority] || 'Medium',
            status: formatStatusLabel(statusKey),
            statusKey,
            date: formatIssueDate(refreshed.createdAt),
            location: [refreshed.building, refreshed.unitNumber, refreshed.specificSpot].filter(Boolean).join(', '),
            description: refreshed.description || 'No description provided.',
            raw: refreshed,
          });
        }
      }

      fetchedIssues
        .filter((issue) => (issue.status === 'completed' || issue.status === 'done and payment pending') && isSameDay(issue.resolvedAt || issue.updatedAt || issue.createdAt))
        .forEach((issue) => {
          const issueLabel = issueTypeLabelMap[issue.issueType] || issue.issueType || 'Maintenance';
          addNotification({
            type: 'issue-completed',
            referenceId: issue._id,
            title: 'Task completed',
            message: `${issueLabel} completed and waiting for payment`,
            target: { path: '/tenant-dashboard', menu: 'dashboard' },
            createdAt: issue.resolvedAt || issue.updatedAt || issue.createdAt
          });
        });

      setNotifications(getNotifications());
    } catch (err) {
      setIssueError('Failed to load requests.');
      setIssues([]);
    } finally {
      setIssueLoading(false);
    }
  }, [selectedRequest?.raw?._id]);

  const fetchPayments = async () => {
    setPaymentLoading(true);
    setPaymentError('');
    try {
      const response = await paymentAPI.getAll();
      setPayments(response.data.payments || []);
    } catch (err) {
      setPaymentError('Failed to load payments.');
      setPayments([]);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    const confirmed = window.confirm('Delete this payment from your history?');
    if (!confirmed) {
      return;
    }

    setDeletingPaymentId(paymentId);
    try {
      await paymentAPI.deleteById(paymentId);
      setPayments((prev) => prev.filter((payment) => payment._id !== paymentId));
    } catch (err) {
      setPaymentError(err?.response?.data?.message || 'Failed to delete payment.');
    } finally {
      setDeletingPaymentId(null);
    }
  };


  useEffect(() => {
    if (activeMenu === 'invoices') {
      fetchInvoices();
    }
  }, [activeMenu]);

  useEffect(() => {
    if (activeMenu === 'dashboard') {
      fetchIssues();
    }
  }, [activeMenu, fetchIssues]);

  usePolling(fetchIssues, 5000, activeMenu === 'dashboard' && role === 'tenant');

  useEffect(() => {
    if (activeMenu === 'payments') {
      fetchPayments();
    }
  }, [activeMenu]);

  const activeRequests = issues.map((issue) => {
    const statusKey = issue.status || 'new';
    return {
      id: formatIssueId(issue._id),
      issue: issueTypeLabelMap[issue.issueType] || issue.issueType || 'Maintenance',
      urgency: priorityLabelMap[issue.priority] || 'Medium',
      status: formatStatusLabel(statusKey),
      statusKey,
      date: formatIssueDate(issue.createdAt),
      location: [getBuildingLabel(issue.building), issue.unit || issue.unitNumber, issue.specificSpot].filter(Boolean).join(', '),
      description: issue.description || 'No description provided.',
      raw: issue,
    };
  });

  const hiddenTenantStatuses = new Set(['cost report submitted', 'cost report approved', 'cost report rejected']);
  const visibleRequests = role === 'tenant'
    ? activeRequests.filter((req) => !hiddenTenantStatuses.has(normalizeStatus(req.statusKey)))
    : activeRequests;

  const todayNotifications = notifications.filter((notification) => isSameDay(notification.createdAt));
  const recentActivity = todayNotifications.slice(0, 3);
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const handleNotificationClick = (notification) => {
    markNotificationRead(notification.id);
    setNotifications(getNotifications());
    setShowNotifications(false);

    const target = notification.target || {};
    if (target.path === '/tenant-dashboard') {
      if (target.menu) {
        setActiveMenu(target.menu);
      }
      if (target.invoiceId) {
        setPendingInvoiceToOpen(target.invoiceId);
      }
      return;
    }

    if (target.path) {
      navigate(target.path);
    }
  };

  useEffect(() => {
    if (activeMenu === 'invoices' && pendingInvoiceToOpen && invoices.length > 0) {
      const match = invoices.find((invoice) => invoice._id === pendingInvoiceToOpen);
      if (match) {
        setSelectedInvoice(match);
      }
      setPendingInvoiceToOpen(null);
    }
  }, [activeMenu, invoices, pendingInvoiceToOpen]);

  const requestHistory = issues
    .filter((issue) => isCompletedStatus(issue.status))
    .map((issue) => ({
      id: formatIssueId(issue._id),
      title: issueTypeLabelMap[issue.issueType] || issue.issueType || 'Maintenance',
      date: `Resolved on ${formatIssueDate(issue.resolvedAt || issue.updatedAt)}`,
      location: [getBuildingLabel(issue.building), issue.unit || issue.unitNumber, issue.specificSpot].filter(Boolean).join(', '),
      notes: issue.resolutionNotes || issue.description || 'No additional notes.',
      technician: issue.assignedTo?.name || 'Maintenance Team',
    }));

  const openRequestsCount = visibleRequests.filter((req) => normalizeStatus(req.statusKey) === 'new').length;
  const completedRequestsCount = visibleRequests.filter((req) => normalizeStatus(req.statusKey) === 'completed').length;
  const taskDoneCount = visibleRequests.filter((req) => normalizeStatus(req.statusKey) === 'task done').length;

  const filteredRequests =
    filterStatus === 'all'
      ? visibleRequests
      : visibleRequests.filter((req) => normalizeStatus(req.statusKey) === normalizeStatus(filterStatus));

  const handleFilterChange = (status) => {
    setFilterStatus((prev) => (prev === status ? 'all' : status));
  };

  const filterLabelMap = {
    all: 'All',
    new: 'New',
    assigned: 'New',
    'in progress': 'In Progress',
    completed: 'Completed',
    'done and payment pending': 'Done & Payment Pending',
    'payment done': 'Payment Done',
    'task done': 'Task Done',
  };

  const activeFilterLabel = filterLabelMap[filterStatus] || 'All';

  const getUrgencyColor = (urgency) => {
    switch (urgency.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-orange-600 bg-orange-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600';
    }
  };

  const getNotificationDotColor = (type) => {
    switch (type) {
      case 'payment-success':
        return 'bg-emerald-400';
      case 'issue-reported':
        return 'bg-blue-400';
      case 'issue-completed':
        return 'bg-green-400';
      default:
        return 'bg-slate-400';
    }
  };

  const getInvoiceBadge = (status) => {
    switch (String(status || '').toLowerCase()) {
      case 'draft':
        return 'bg-gray-100 text-gray-700 border border-gray-200';
      case 'submitted':
        return 'bg-sky-100 text-sky-800 border border-sky-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'paid':
        return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'overdue':
        return 'bg-red-100 text-red-700 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  const formatInvoiceStatus = (status) => {
    if (String(status || '').toLowerCase() === 'draft') {
      return 'Draft';
    }
    if (String(status || '').toLowerCase() === 'submitted') {
      return 'Invoice Submitted';
    }
    if (String(status || '').toLowerCase() === 'paid') {
      return 'Payment Done';
    }
    return status;
  };

  const getPaymentBadge = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'canceled':
        return 'bg-slate-100 text-slate-700 border border-slate-200';
      case 'failed':
        return 'bg-red-100 text-red-700 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center gap-4">
          <Logo size={32} textClassName="text-lg font-bold text-gray-900" />
          <div className="flex items-center gap-6">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications((prev) => !prev)}
                className="p-2 hover:bg-slate-100 rounded-lg transition relative"
              >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden z-50">
                  <div className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-50">
                    Notifications
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-slate-500">No notifications yet.</div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.slice(0, 6).map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => handleNotificationClick(notification)}
                          className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition ${
                            notification.read ? 'text-slate-500' : 'text-slate-900'
                          }`}
                        >
                          <p className="text-xs font-semibold">{notification.title}</p>
                          {notification.message && (
                            <p className="text-[11px] text-slate-500 mt-1">{notification.message}</p>
                          )}
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <ProfileDropdown userName={userName} userInitials={userInitials} profileImage={profileImage} />
          </div>
        </div>
      </nav>

      <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-4 sm:gap-6 items-start">
          {/* Sidebar */}
          <aside className="bg-white shadow-sm border border-slate-200 rounded-2xl lg:sticky lg:top-[84px]">
            <div className="p-4 space-y-1">
            <button
              onClick={() => setActiveMenu('dashboard')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeMenu === 'dashboard'
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                  : 'text-gray-700 hover:bg-slate-50'
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => navigate('/invoices')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeMenu === 'invoices'
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                  : 'text-gray-700 hover:bg-slate-50'
              }`}
            >
              📄 My Invoices
            </button>
            <button
              onClick={() => navigate('/payment-history')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeMenu === 'payments'
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                  : 'text-gray-700 hover:bg-slate-50'
              }`}
            >
              💳 Payment History
            </button>
            <button
              onClick={() => navigate('/profile')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeMenu === 'settings'
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                  : 'text-gray-700 hover:bg-slate-50'
              }`}
            >
              ⚙️ Settings
            </button>
            <hr className="my-4" />
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 font-medium transition"
            >
              🚪 Logout
            </button>
          </div>
          </aside>

          {/* Main Content */}
          <main className="min-w-0">
          {activeMenu === 'dashboard' && (
            <>
              {/* Header Section */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                  <p className="text-gray-600 mt-1 text-sm">Welcome back, <span className="font-semibold text-gray-900">{userName}</span> 👋</p>
                </div>
                <button
                  onClick={() => navigate('/report-issue')}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-bold py-2 px-4 rounded-lg transition shadow-md hover:shadow-lg text-sm self-start"
                >
                  + Report New Issue
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            <button
              type="button"
              onClick={() => handleFilterChange('new')}
              className={`bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm p-5 border-2 hover:shadow-md transition text-left ${
                filterStatus === 'new' ? 'border-blue-500 ring-1 ring-blue-300' : 'border-blue-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-xs font-bold mb-2 uppercase tracking-wide">Open Requests</p>
                  <p className="text-4xl font-bold text-blue-900">{openRequestsCount}</p>
                  <p className="text-blue-700 text-xs mt-3">Waiting for maintenance</p>
                </div>
                <div className="text-4xl">📋</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('completed')}
              className={`bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm p-5 border-2 hover:shadow-md transition text-left ${
                filterStatus === 'completed' ? 'border-green-500 ring-1 ring-green-300' : 'border-green-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-xs font-bold mb-2 uppercase tracking-wide">Completed</p>
                  <p className="text-4xl font-bold text-green-900">{completedRequestsCount}</p>
                  <p className="text-green-700 text-xs mt-3">Tasks resolved</p>
                </div>
                <div className="text-4xl">✅</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('task done')}
              className={`bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl shadow-sm p-5 border-2 hover:shadow-md transition text-left ${
                filterStatus === 'task done' ? 'border-teal-500 ring-1 ring-teal-300' : 'border-teal-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-600 text-xs font-bold mb-2 uppercase tracking-wide">Task Done</p>
                  <p className="text-4xl font-bold text-teal-900">{taskDoneCount}</p>
                  <p className="text-teal-700 text-xs mt-3">Ready for closure</p>
                </div>
                <div className="text-4xl">🧾</div>
              </div>
            </button>
          </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Active Requests */}
            <div className="xl:col-span-2 space-y-4">
              <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900">Active Requests</h3>
                    <span className="text-[10px] text-slate-500">Showing: {activeFilterLabel}</span>
                  </div>
                  {filterStatus !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setFilterStatus('all')}
                      className="text-[10px] text-blue-600 font-semibold hover:underline"
                    >
                      View All
                    </button>
                  )}
                </div>
                {issueError && <p className="text-xs text-red-600 mb-2">{issueError}</p>}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left px-3 py-1.5 text-xs font-semibold text-gray-700">ID</th>
                        <th className="text-left px-3 py-1.5 text-xs font-semibold text-gray-700">Issue</th>
                        <th className="text-left px-3 py-1.5 text-xs font-semibold text-gray-700">Urgency</th>
                        <th className="text-left px-3 py-1.5 text-xs font-semibold text-gray-700">Status</th>
                        <th className="text-left px-3 py-1.5 text-xs font-semibold text-gray-700">Date</th>
                        <th className="text-left px-3 py-1.5 text-xs font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {issueLoading ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-6 text-center text-xs text-slate-500">
                            Loading requests...
                          </td>
                        </tr>
                      ) : filteredRequests.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-6 text-center text-xs text-slate-500">
                            No requests found.
                          </td>
                        </tr>
                      ) : (
                        filteredRequests.map((req) => (
                          <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                            <td className="px-3 py-1.5 text-xs font-medium text-blue-600">{req.id}</td>
                            <td className="px-3 py-1.5 text-xs text-gray-900">{req.issue}</td>
                            <td className={`px-3 py-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${getUrgencyColor(req.urgency)}`}>
                              {req.urgency}
                            </td>
                            <td className="px-3 py-1.5 text-xs">
                              <span className={`inline-flex items-center justify-center min-w-[8.5rem] px-3.5 py-1 rounded-full whitespace-nowrap text-xs font-bold ${getStatusBadgeTheme(req.status, 'pill').className}`}>
                                {getStatusBadgeTheme(req.status, 'pill').text}
                              </span>
                            </td>
                            <td className="px-3 py-1.5 text-xs text-gray-600">{req.date}</td>
                            <td className="px-3 py-1.5 text-xs">
                              <button
                                type="button"
                                onClick={() => setSelectedRequest(req)}
                                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                              >
                                View All
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Request History */}
              <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Request History</h3>
                {requestHistory.length === 0 ? (
                  <p className="text-xs text-slate-500">No completed requests yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {requestHistory.map((req) => (
                      <button
                        key={req.id}
                        type="button"
                        onClick={() => setSelectedHistory(req)}
                        className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-3 hover:shadow-md transition hover:border-slate-300 text-left"
                      >
                        <p className="font-bold text-gray-900 text-sm">{req.id}</p>
                        <p className="text-gray-700 mt-1 font-medium text-xs">{req.title}</p>
                        <p className="text-xs text-gray-600 mt-2">✓ {req.date}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700 rounded-xl shadow-lg p-4 text-white">
                <h3 className="text-sm font-bold mb-2">Quick Actions</h3>

                <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
                  {pendingInvoices.length === 0 ? (
                    <div className="bg-white rounded-lg p-3 text-slate-900">
                      <p className="text-xs font-semibold">Payment Pending</p>
                      <p className="text-xs text-slate-600 mt-1">No pending invoices at the moment.</p>
                    </div>
                  ) : (
                    pendingInvoices.map((invoice) => (
                      <div key={invoice._id} className="bg-white rounded-lg p-3 text-slate-900">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-amber-700">Payment Pending</p>
                            <p className="text-sm font-bold text-slate-900 truncate">
                              {invoice.issueTitle || invoice.invoiceNumber || 'Maintenance invoice'}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-1">{invoice.invoiceNumber || invoice._id}</p>
                            <p className="text-xs text-slate-600 mt-1 truncate">
                              {invoice.locationLabel || 'Pending maintenance charge'}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-bold ${
                              String(invoice.status || '').toLowerCase() === 'overdue'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {formatInvoiceStatus(invoice.status)}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold text-slate-700">
                            LKR {Number(invoice.total || 0).toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => openPaymentPage(invoice)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg text-xs transition"
                          >
                            💳 Pay Now
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
                {recentActivity.length === 0 ? (
                  <p className="text-xs text-slate-500">No recent activity yet.</p>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNotificationClick(item)}
                        className="w-full text-left flex gap-4 pb-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 rounded-lg px-2 -mx-2"
                      >
                        <div className={`w-4 h-4 rounded-full flex-shrink-0 mt-1 ${getNotificationDotColor(item.type)}`}></div>
                        <div className="min-w-0">
                          <p className="text-sm text-gray-900">
                            <span className="font-bold">{item.title}</span>
                            {item.message && <span className="text-slate-600"> {item.message}</span>}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">{new Date(item.createdAt).toLocaleString()}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
              </div>
            </>
          )}

          {activeMenu === 'invoices' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">My Invoices</h2>
                  <p className="text-gray-600 mt-1 text-sm">View and manage your maintenance invoices.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMenu('dashboard')}
                  className="text-sm text-blue-600 font-semibold hover:underline"
                >
                  ← Back to Dashboard
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900">Invoice List</h3>
                  <span className="text-xs text-slate-500">
                    {invoiceLoading ? 'Loading...' : `${invoices.length} invoices`}
                  </span>
                </div>
                {invoiceError && <p className="text-xs text-red-600 mb-3">{invoiceError}</p>}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-700">Invoice</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-700">Issue</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-700">Date</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-700">Total</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-700">Status</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.length === 0 && !invoiceLoading ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-6 text-center text-xs text-slate-500">
                            No invoices found.
                          </td>
                        </tr>
                      ) : (
                        invoices.map((invoice) => (
                          <tr key={invoice._id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                            <td className="px-3 py-2 text-xs font-semibold text-blue-600">{invoice.invoiceNumber}</td>
                            <td className="px-3 py-2 text-xs text-gray-900">{invoice.issueTitle}</td>
                            <td className="px-3 py-2 text-xs text-gray-600">
                              {new Date(invoice.issuedAt).toLocaleDateString()}
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-900 font-semibold">LKR {invoice.total.toFixed(2)}</td>
                            <td className="px-3 py-2 text-xs">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getInvoiceBadge(invoice.status)}`}>
                                {formatInvoiceStatus(invoice.status)}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-xs">
                              <button
                                type="button"
                                onClick={() => setSelectedInvoice(invoice)}
                                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeMenu === 'payments' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Payment History</h2>
                  <p className="text-gray-600 mt-1 text-sm">Review your recent maintenance payments.</p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900">Payment List</h3>
                  <span className="text-xs text-slate-500">
                    {paymentLoading ? 'Loading...' : `${payments.length} payments`}
                  </span>
                </div>
                {paymentError && <p className="text-xs text-red-600 mb-3">{paymentError}</p>}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-700">Order</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-700">Issue</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-700">Amount</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-700">Time</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-700">Method</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentLoading ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-6 text-center text-xs text-slate-500">
                            Loading payments...
                          </td>
                        </tr>
                      ) : payments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-6 text-center text-xs text-slate-500">
                            No payments found.
                          </td>
                        </tr>
                      ) : (
                        payments.map((payment) => {
                          return (
                            <tr key={payment._id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                              <td className="px-3 py-2 text-xs font-semibold text-blue-600">{payment.orderId}</td>
                              <td className="px-3 py-2 text-xs text-gray-900">{payment.items || 'Maintenance Payment'}</td>
                              <td className="px-3 py-2 text-xs text-gray-900 font-semibold">
                                {payment.currency || 'LKR'} {Number(payment.amount).toFixed(2)}
                              </td>
                              <td className="px-3 py-2 text-xs text-gray-600">
                                {payment.createdAt ? new Date(payment.createdAt).toLocaleString() : '-'}
                              </td>
                              <td className="px-3 py-2 text-xs text-gray-600">
                                {payment.paymentMethod || 'PayHere'}
                              </td>
                              <td className="px-3 py-2 text-xs">
                                <button
                                  type="button"
                                  onClick={() => handleDeletePayment(payment._id)}
                                  disabled={deletingPaymentId === payment._id}
                                  className="text-red-600 hover:text-red-700 font-semibold hover:underline disabled:opacity-60"
                                >
                                  {deletingPaymentId === payment._id ? 'Deleting...' : 'Delete'}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeMenu === 'settings' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                  <p className="text-gray-600 mt-1 text-sm">Manage your preferences and account settings.</p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
                <p className="text-sm text-slate-500">Settings panel coming soon.</p>
              </div>
            </>
          )}
          </main>
        </div>
      </div>

      {activeMenu === 'dashboard' && selectedHistory && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-[420px] p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Completed Request</p>
                <h4 className="text-lg font-bold text-slate-900 mt-1">
                  {selectedHistory.title}
                </h4>
                <p className="text-xs text-slate-500 mt-1">{selectedHistory.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHistory(null)}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Close
              </button>
            </div>
            <div className="mt-4 space-y-2">
              <div className="text-xs text-slate-600">
                <span className="font-semibold">Location:</span> {selectedHistory.location}
              </div>
              <div className="text-xs text-slate-600">
                <span className="font-semibold">Resolved:</span> {selectedHistory.date}
              </div>
              <div className="text-xs text-slate-600">
                <span className="font-semibold">Handled By:</span> {selectedHistory.technician}
              </div>
              <div className="text-xs text-slate-600">
                <span className="font-semibold">Notes:</span> {selectedHistory.notes}
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedHistory(null)}
                className="px-3 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {activeMenu === 'dashboard' && selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-[460px] p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Request Details</p>
                <h4 className="text-lg font-bold text-slate-900 mt-1">
                  {selectedRequest.issue}
                </h4>
                <p className="text-xs text-slate-500 mt-1">{selectedRequest.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Close
              </button>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Status Progress</p>
                <p className="text-[10px] text-slate-500">Live updates while this panel is open</p>
              </div>
              <div className="overflow-x-auto pb-2">
                <div className="flex items-start min-w-[760px]">
                  {buildRequestTimeline(selectedRequest.raw).map((step, index, steps) => (
                    <div key={step.value} className="flex items-start flex-1 min-w-[92px]">
                      <div className="flex flex-col items-center flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition ${step.reached ? step.dot : 'bg-slate-100 border-slate-200'}`}>
                          <span className={`text-[10px] font-black ${step.reached ? 'text-white' : 'text-slate-400'}`}>
                            {index + 1}
                          </span>
                        </div>
                        <p className={`mt-2 text-[10px] leading-tight text-center font-semibold ${step.active ? 'text-slate-900' : step.reached ? 'text-slate-700' : 'text-slate-400'}`}>
                          {step.label}
                        </p>
                        <p className="mt-1 text-[10px] text-center text-slate-400 min-h-[1.5rem]">
                          {step.timestamp ? new Date(step.timestamp).toLocaleString() : 'Pending'}
                        </p>
                        {step.reason && (
                          <p className="mt-1 text-[10px] text-center text-slate-500 line-clamp-2 max-w-[95px]">
                            {step.reason}
                          </p>
                        )}
                      </div>
                      {index < steps.length - 1 && (
                        <div className="flex-1 px-2 pt-4">
                          <div className={`h-1 rounded-full transition ${step.reached ? step.bar : 'bg-slate-200'}`} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
              <div className="flex justify-between gap-3">
                <span className="font-semibold">Current Status:</span>
                <span className="text-right">{selectedRequest.status}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="font-semibold">Urgency:</span>
                <span>{selectedRequest.urgency}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="font-semibold">Reported:</span>
                <span>{selectedRequest.date}</span>
              </div>
              <div>
                <span className="font-semibold">Location:</span>
                <p className="mt-1">{selectedRequest.location}</p>
              </div>
              <div>
                <span className="font-semibold">Description:</span>
                <p className="mt-1">{selectedRequest.description}</p>
              </div>
              {selectedRequest.raw?.media?.length > 0 && (
                <div>
                  <span className="font-semibold">Attachments:</span>
                  <div className="mt-2">
                    <IssueMediaGallery media={selectedRequest.raw.media} />
                  </div>
                </div>
              )}
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-3 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {activeMenu === 'invoices' && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-[440px] p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Invoice Details</p>
                <h4 className="text-lg font-bold text-slate-900 mt-1">
                  {selectedInvoice.issueTitle || selectedInvoice.issue || 'Maintenance'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedInvoice.invoiceNumber || selectedInvoice.id || selectedInvoice._id}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Task: {selectedInvoice.taskId || selectedInvoice.issue?._id || selectedInvoice.issue || '—'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Task Name: {selectedInvoice.taskName || selectedInvoice.relatedIssueLabel || '—'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Close
              </button>
            </div>
            <div className="mt-4 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="font-semibold">Location:</span>
                <span>{selectedInvoice.locationLabel || `${getBuildingLabel(selectedInvoice.location?.building)}, Unit ${selectedInvoice.location?.unitNumber || '—'}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Related Issue:</span>
                <span className="text-right max-w-[240px]">{selectedInvoice.relatedIssueLabel || getIssueLabel(selectedInvoice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Invoice Date:</span>
                <span>{new Date(selectedInvoice.issuedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Due Date:</span>
                <span>{selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString() : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Labor Charges:</span>
                <span>LKR {Number(selectedInvoice.laborCharge ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Parts Replacement:</span>
                <span>LKR {Number(selectedInvoice.partsCharge ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-900">
                <span>Total:</span>
                <span>LKR {Number(selectedInvoice.total ?? 0).toFixed(2)}</span>
              </div>
              <p className="text-[11px] text-slate-400">{selectedInvoice.notes || 'No additional notes.'}</p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
              >
                Close
              </button>
              {['submitted', 'pending', 'overdue'].includes(String(selectedInvoice.status || '').toLowerCase()) && (
                <button
                  type="button"
                  onClick={() => openPaymentPage(selectedInvoice)}
                  className="px-3 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg"
                >
                  Pay Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
