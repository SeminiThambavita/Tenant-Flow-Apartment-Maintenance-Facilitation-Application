import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { invoiceAPI } from '../api';

export default function TenantDashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [userName, setUserName] = useState('Tenant');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');

  useEffect(() => {
    if (role !== 'tenant') {
      navigate('/login');
    }
    setUserName('Sumi');
  }, [role, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const activeRequests = [
    {
      id: '#00124',
      issue: 'Leaky Faucet',
      urgency: 'Medium',
      status: 'Pending',
      date: '2023-10-26',
      location: 'Building A, Apt 402',
      description: 'Dripping faucet in master bathroom. Water pooling under sink.',
    },
    {
      id: '#00123',
      issue: 'Broken Heater',
      urgency: 'High',
      status: 'In Progress',
      date: '2023-10-24',
      location: 'Building A, Apt 402',
      description: 'Heater not turning on. No warm air output.',
    },
    {
      id: '#00122',
      issue: 'Cracked Window',
      urgency: 'Low',
      status: 'Completed',
      date: '2023-10-22',
      location: 'Building A, Apt 402',
      description: 'Small crack on living room window glass.',
    },
  ];

  const recentActivity = [
    { status: 'In Progress', title: 'Maintenance scheduled for', id: '#00123', time: 'Today, 5:30 AM' },
    { status: 'Completed', title: 'Request #00122 marked as complete', time: 'Yesterday, 4:10 PM' },
    { status: 'Pending', title: 'New request #00124 submitted', time: '2 days ago' },
  ];

  const requestHistory = [
    {
      id: '#00121',
      title: 'Clogged Drain',
      date: 'Resolved on 2023-10-15',
      location: 'Building A, Apt 402, Kitchen Sink',
      notes: 'Cleared blockage and tested flow.',
      technician: 'Maintenance Team A',
    },
    {
      id: '#00120',
      title: 'A/C Not Cooling',
      date: 'Resolved on 2023-10-11',
      location: 'Building A, Apt 402, Living Room',
      notes: 'Replaced filter and recharged unit.',
      technician: 'Maintenance Team B',
    },
    {
      id: '#00119',
      title: 'Light Fixture Out',
      date: 'Resolved on 2023-10-05',
      location: 'Building A, Apt 402, Hallway',
      notes: 'Replaced fixture and tested wiring.',
      technician: 'Maintenance Team A',
    },
  ];

  const fetchInvoices = async () => {
    setInvoiceLoading(true);
    setInvoiceError('');
    try {
      const response = await invoiceAPI.getAll();
      setInvoices(response.data.invoices || []);
    } catch (err) {
      setInvoiceError('Failed to load invoices.');
      setInvoices([]);
    } finally {
      setInvoiceLoading(false);
    }
  };

  useEffect(() => {
    if (activeMenu === 'invoices') {
      fetchInvoices();
    }
  }, [activeMenu]);

  const openRequestsCount = activeRequests.filter((req) => req.status.toLowerCase() === 'pending').length;
  const completedRequestsCount = activeRequests.filter((req) => req.status.toLowerCase() === 'completed').length;

  const filteredRequests =
    filterStatus === 'all'
      ? activeRequests
      : activeRequests.filter((req) => req.status.toLowerCase() === filterStatus);

  const handleFilterChange = (status) => {
    setFilterStatus((prev) => (prev === status ? 'all' : status));
  };

  const filterLabelMap = {
    all: 'All',
    pending: 'Pending',
    completed: 'Completed',
    'in progress': 'In Progress',
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

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'in progress':
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-800 border border-green-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-400';
      case 'in progress':
        return 'bg-blue-400';
      case 'completed':
        return 'bg-green-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getInvoiceBadge = (status) => {
    switch (status.toLowerCase()) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">TF</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900">Tenant Flow</h1>
          </div>
          <div className="flex items-center gap-6">
            <button className="p-2 hover:bg-slate-100 rounded-lg transition">
              <span className="text-xl">🔔</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 px-3 py-2 rounded-lg transition"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                S
              </div>
              <span className="text-xs font-medium text-gray-700">{userName}</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="flex justify-center">
        {/* Sidebar */}
        <div className="w-56 bg-white shadow-sm min-h-screen sticky top-20">
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
              onClick={() => setActiveMenu('invoices')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeMenu === 'invoices'
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                  : 'text-gray-700 hover:bg-slate-50'
              }`}
            >
              📄 My Invoices
            </button>
            <button
              onClick={() => setActiveMenu('payments')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeMenu === 'payments'
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                  : 'text-gray-700 hover:bg-slate-50'
              }`}
            >
              💳 Payments
            </button>
            <button
              onClick={() => setActiveMenu('settings')}
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
        </div>

        {/* Main Content */}
        <div className="flex-1 max-w-6xl p-3">
          {activeMenu === 'dashboard' && (
            <>
              {/* Header Section */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                  <p className="text-gray-600 mt-1 text-sm">Welcome back, <span className="font-semibold text-gray-900">{userName}</span> 👋</p>
                </div>
                <button
                  onClick={() => navigate('/report-issue')}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-bold py-2 px-4 rounded-lg transition shadow-md hover:shadow-lg text-sm"
                >
                  + Report New Issue
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              type="button"
              onClick={() => handleFilterChange('pending')}
              className={`bg-white rounded-xl shadow-sm p-4 border hover:shadow-md transition text-left ${
                filterStatus === 'pending' ? 'border-blue-200 ring-1 ring-blue-200' : 'border-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs font-medium mb-1">Open Requests</p>
                  <p className="text-3xl font-bold text-gray-900">{openRequestsCount}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center text-2xl">
                  📋
                </div>
              </div>
              <p className="text-gray-500 text-xs mt-2">Waiting for maintenance</p>
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('completed')}
              className={`bg-white rounded-xl shadow-sm p-4 border hover:shadow-md transition text-left ${
                filterStatus === 'completed' ? 'border-blue-200 ring-1 ring-blue-200' : 'border-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs font-medium mb-1">Completed This Month</p>
                  <p className="text-3xl font-bold text-gray-900">{completedRequestsCount}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center text-2xl">
                  ✅
                </div>
              </div>
              <p className="text-gray-500 text-xs mt-2">Tasks resolved</p>
            </button>
          </div>

              <div className="grid grid-cols-3 gap-4">
            {/* Active Requests */}
            <div className="col-span-2 space-y-4">
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
                      {filteredRequests.map((req, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition">
                          <td className="px-3 py-1.5 text-xs font-medium text-blue-600">{req.id}</td>
                          <td className="px-3 py-1.5 text-xs text-gray-900">{req.issue}</td>
                          <td className={`px-3 py-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${getUrgencyColor(req.urgency)}`}>
                            {req.urgency}
                          </td>
                          <td className="px-3 py-1.5 text-xs">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(req.status)}`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="px-3 py-1.5 text-xs text-gray-600">{req.date}</td>
                          <td className="px-3 py-1.5 text-xs">
                            <button className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">View</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Request History */}
              <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Request History</h3>
                <div className="grid grid-cols-3 gap-6">
                  {requestHistory.map((req, idx) => (
                    <button
                      key={idx}
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
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
                <h3 className="text-sm font-bold mb-3">Quick Actions</h3>

                {/* Payment Due */}
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 mb-4">
                  <p className="text-blue-100 text-xs font-medium">Payment Due</p>
                  <p className="text-3xl font-bold mt-1">Rs.1500</p>
                  <button
                    type="button"
                    onClick={() => navigate('/payment')}
                    className="w-full bg-white hover:bg-blue-50 text-blue-600 hover:text-blue-700 font-bold py-3 px-4 rounded-lg mt-4 transition transform hover:scale-105"
                  >
                    💳 Pay Now
                  </button>
                </div>

                <div className="h-px bg-white bg-opacity-20 my-4"></div>

                {/* Notifications */}
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
                  <p className="text-blue-100 text-xs font-medium">Notifications</p>
                  <p className="text-lg font-bold mt-0.5">2</p>
                  <p className="text-blue-100 text-xs mt-0.5">new updates</p>
                  <button className="text-white hover:text-blue-100 text-sm font-bold mt-4 underline">View All →</button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {recentActivity.map((item, idx) => (
                    <div key={idx} className="flex gap-4 pb-4 border-b border-slate-100 last:border-b-0">
                      <div className={`w-4 h-4 rounded-full flex-shrink-0 mt-1 ${getActivityStatusColor(item.status)}`}></div>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-900">
                          <span className="font-bold">{item.title}</span> <span className="text-blue-600 font-bold">{item.id}</span>
                        </p>
                        <p className="text-xs text-gray-600 mt-1">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
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
                                {invoice.status}
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
                  <h2 className="text-2xl font-bold text-gray-900">Payments</h2>
                  <p className="text-gray-600 mt-1 text-sm">Track your completed and pending payments.</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/payment')}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg"
                >
                  Make a Payment
                </button>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
                <p className="text-sm text-slate-500">Payments view will show transactions once PayHere callbacks are received.</p>
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

      {activeMenu === 'invoices' && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-[440px] p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Invoice Details</p>
                <h4 className="text-lg font-bold text-slate-900 mt-1">
                  {selectedInvoice.issue}
                </h4>
                <p className="text-xs text-slate-500 mt-1">{selectedInvoice.id}</p>
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
                <span className="font-semibold">Invoice Date:</span>
                <span>{new Date(selectedInvoice.issuedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Due Date:</span>
                <span>{selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString() : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Labor Charges:</span>
                <span>LKR {selectedInvoice.laborCharge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Parts Replacement:</span>
                <span>LKR {selectedInvoice.partsCharge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-900">
                <span>Total:</span>
                <span>LKR {selectedInvoice.total.toFixed(2)}</span>
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
              {selectedInvoice.status.toLowerCase() !== 'paid' && (
                <button
                  type="button"
                  onClick={() => navigate('/payment', { state: { invoice: selectedInvoice } })}
                  className="px-3 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg"
                >
                  Pay Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 mt-2">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-2 gap-12">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                  TF
                </div>
                <h3 className="text-sm font-bold text-gray-900">Tenant Flow</h3>
              </div>
              <p className="text-gray-600 mt-2">Apartment Maintenance Facilitation</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">NEED IMMEDIATE HELP?</p>
              <p className="text-sm text-gray-600 mt-2">📞 <span className="font-semibold">0112-XXX-XXX</span> (24/7)</p>
              <p className="text-sm text-gray-600">📧 <span className="font-semibold">support@tenantflow.lk</span></p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
