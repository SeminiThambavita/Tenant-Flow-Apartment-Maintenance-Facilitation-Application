import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, issueAPI } from '../api';
import AdminSidebar from '../components/AdminSidebar';
import usePolling from '../hooks/usePolling';

const formatStatusLabel = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (!normalized) return 'new';
  return normalized;
};

export default function AdminProperties() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const [profileName, setProfileName] = useState('Property Manager');
  const [tenants, setTenants] = useState([]);
  const [issues, setIssues] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/login', { state: { role: 'admin' } });
      return;
    }

    const loadData = async () => {
      try {
        const [profileResponse, tenantResponse, issueResponse] = await Promise.all([
          authAPI.getProfile(),
          authAPI.getTenants(),
          issueAPI.getAll({ status: 'all' })
        ]);

        const currentUser = profileResponse?.data?.user || {};
        setProfileName(currentUser.name || 'Property Manager');
        setTenants(tenantResponse?.data?.tenants || []);
        setIssues(issueResponse?.data?.issues || []);
      } catch {
        setTenants([]);
        setIssues([]);
      }
    };

    loadData();
  }, [navigate, role]);

  usePolling(async () => {
    if (role !== 'admin') return;

    try {
      const [profileResponse, tenantResponse, issueResponse] = await Promise.all([
        authAPI.getProfile(),
        authAPI.getTenants(),
        issueAPI.getAll({ status: 'all' })
      ]);

      const currentUser = profileResponse?.data?.user || {};
      setProfileName(currentUser.name || 'Property Manager');
      setTenants(tenantResponse?.data?.tenants || []);
      setIssues(issueResponse?.data?.issues || []);
    } catch {
      setTenants([]);
      setIssues([]);
    }
  }, 5000, role === 'admin');

  const issuesByTenant = useMemo(() => {
    const map = new Map();
    issues.forEach((issue) => {
      const tenantId = issue.tenant?._id || issue.tenant;
      if (!tenantId) return;
      const current = map.get(tenantId) || { total: 0, latestStatus: 'new', latestUpdatedAt: '' };
      current.total += 1;
      const updatedAt = issue.updatedAt || issue.createdAt;
      if (!current.latestUpdatedAt || new Date(updatedAt).getTime() > new Date(current.latestUpdatedAt).getTime()) {
        current.latestUpdatedAt = updatedAt;
        current.latestStatus = issue.status || 'new';
      }
      map.set(tenantId, current);
    });
    return map;
  }, [issues]);

  const propertyRows = useMemo(() => {
    return tenants
      .map((tenant) => {
        const issueInfo = issuesByTenant.get(tenant._id) || { total: 0, latestStatus: 'new', latestUpdatedAt: '' };
        const buildingName = typeof tenant.building === 'object'
          ? tenant.building?.name
          : tenant.buildingName;
        const floorNumber = tenant.floor ?? tenant.floorNumber;
        const unitNumber = tenant.unit ?? tenant.unitNumber ?? tenant.apartmentNumber;
        return {
          id: tenant._id,
          tenantName: tenant.name || 'N/A',
          email: tenant.email || 'N/A',
          phone: tenant.phone || 'N/A',
          building: buildingName || 'N/A',
          unit: unitNumber || 'N/A',
          apartment: tenant.apartmentNumber || 'N/A',
          floor: floorNumber ?? 'N/A',
          nic: tenant.nic || 'N/A',
          totalIssues: issueInfo.total,
          latestRepairStatus: formatStatusLabel(issueInfo.latestStatus),
          latestUpdatedAt: issueInfo.latestUpdatedAt
        };
      })
      .sort((a, b) => {
        if (a.building === b.building) {
          if (String(a.unit) === String(b.unit)) {
            return a.tenantName.localeCompare(b.tenantName);
          }
          return String(a.unit).localeCompare(String(b.unit));
        }
        return String(a.building).localeCompare(String(b.building));
      });
  }, [tenants, issuesByTenant]);

  const totals = useMemo(() => {
    return {
      tenants: propertyRows.length,
      buildings: new Set(propertyRows.map((row) => row.building)).size,
      units: new Set(propertyRows.map((row) => `${row.building}-${row.unit}`)).size,
      apartments: new Set(propertyRows.map((row) => row.apartment)).size
    };
  }, [propertyRows]);

  const recentUpdates = useMemo(() => {
    return [...issues]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
      .slice(0, 8)
      .map((issue) => ({
        id: issue._id,
        title: `${issue.issueType || 'Maintenance'} • ${issue.building?.name || issue.building || 'N/A'} ${issue.unit || issue.unitNumber || ''}`,
        message: `Status: ${formatStatusLabel(issue.status)}${issue.assignedTo?.name ? ` • Staff: ${issue.assignedTo.name}` : ''}`,
        createdAt: issue.updatedAt || issue.createdAt
      }));
  }, [issues]);

  return (
    <div className="min-h-screen bg-[#F3F4F8] text-[#1D1D2C] flex">
      <AdminSidebar active="properties" profileName={profileName} />

      <main className="flex-1 px-8 py-6 pb-16">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin-dashboard')} className="w-7 h-7 rounded-md border border-[#DCE0EE] text-[#596080] bg-white">←</button>
            <h1 className="text-[24px] font-semibold text-[#20253A]">Property Details Reference</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNotifications((prev) => !prev)}
              className="w-8 h-8 rounded-md border border-[#E2E6F2] bg-white text-[#5E6686]"
            >
              🔔
            </button>
            {showNotifications && (
              <div className="absolute right-8 mt-72 w-80 bg-white border border-[#E2E6F2] rounded-lg shadow z-50 overflow-hidden">
                <div className="px-3 py-2 text-[11px] font-semibold text-[#596080] border-b border-[#EEF0F6]">Recent Updates</div>
                {recentUpdates.length === 0 ? (
                  <div className="px-3 py-4 text-[11px] text-[#7681A8]">No updates yet.</div>
                ) : (
                  recentUpdates.map((item) => (
                    <div key={item.id} className="px-3 py-2 border-b border-[#EEF0F6]">
                      <p className="text-[11px] font-semibold text-[#20253A]">{item.title}</p>
                      <p className="text-[10px] text-[#7681A8] mt-0.5">{item.message}</p>
                    </div>
                  ))
                )}
              </div>
            )}
            <button onClick={() => navigate('/admin-dashboard')} className="px-3 py-1.5 rounded-md bg-[#E8EAF5] text-[11px] font-semibold text-[#2E3348]">Back to Dashboard</button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-lg border border-[#DDE2F0] px-4 py-3">
            <p className="text-[11px] text-[#4B5AA4] mb-1">Total Tenants</p>
            <p className="text-[30px] font-semibold leading-none text-[#1F2233]">{totals.tenants}</p>
          </div>
          <div className="bg-white rounded-lg border border-[#DDE2F0] px-4 py-3">
            <p className="text-[11px] text-[#4B5AA4] mb-1">Buildings</p>
            <p className="text-[30px] font-semibold leading-none text-[#1F2233]">{totals.buildings}</p>
          </div>
          <div className="bg-white rounded-lg border border-[#DDE2F0] px-4 py-3">
            <p className="text-[11px] text-[#4B5AA4] mb-1">Units</p>
            <p className="text-[30px] font-semibold leading-none text-[#1F2233]">{totals.units}</p>
          </div>
          <div className="bg-white rounded-lg border border-[#DDE2F0] px-4 py-3">
            <p className="text-[11px] text-[#4B5AA4] mb-1">Apartments</p>
            <p className="text-[30px] font-semibold leading-none text-[#1F2233]">{totals.apartments}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#DDE2F0] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#ECEFF7]">
            <h2 className="text-[20px] font-semibold text-[#1F2233]">All Tenant Property Details</h2>
          </div>

          <div className="grid grid-cols-11 px-4 py-2 text-[10px] font-semibold text-[#7079A3] bg-[#F7F8FC] border-b border-[#ECEFF7]">
            <span>TENANT</span>
            <span>EMAIL</span>
            <span>PHONE</span>
            <span>BUILDING</span>
            <span>UNIT</span>
            <span>APARTMENT</span>
            <span>FLOOR</span>
            <span>NIC</span>
            <span>TASKS</span>
            <span>LATEST STATUS</span>
            <span>LAST UPDATED</span>
          </div>

          {propertyRows.length === 0 ? (
            <div className="px-4 py-6 text-[12px] text-[#7681A8]">No tenant data available yet.</div>
          ) : (
            propertyRows.map((row) => (
              <div key={row.id} className="grid grid-cols-11 items-center px-4 py-2.5 text-[11px] border-b last:border-b-0 border-[#ECEFF7]">
                <span className="font-medium truncate">{row.tenantName}</span>
                <span className="truncate">{row.email}</span>
                <span>{row.phone}</span>
                <span>{row.building}</span>
                <span>{row.unit}</span>
                <span>{row.apartment}</span>
                <span>{row.floor}</span>
                <span className="truncate">{row.nic}</span>
                <span>{row.totalIssues}</span>
                <span className="capitalize">{row.latestRepairStatus}</span>
                <span>{row.latestUpdatedAt ? new Date(row.latestUpdatedAt).toLocaleString() : 'N/A'}</span>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
