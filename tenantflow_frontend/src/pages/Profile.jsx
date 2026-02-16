import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const [activeSection, setActiveSection] = useState('personal');
  const [profileForm, setProfileForm] = useState({
    name: 'Sumi Perera',
    email: 'sumi@example.com',
    phone: '+94 77 123 4567',
    residence: 'Building A, Apt 402',
    nic: '999999999V',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (role !== 'tenant') {
      navigate('/login');
    }
  }, [role, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = (event) => {
    event.preventDefault();
  };

  const handlePasswordSubmit = (event) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordError('');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">TF</span>
            </div>
            <span className="text-lg font-bold text-gray-900">Tenant Flow</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/tenant-dashboard')}
            className="text-xs font-semibold text-blue-600"
          >
            Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-6">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              S
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Sumi Perera</h1>
              <p className="text-xs text-slate-500">Tenant Profile</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-slate-500">Email</p>
              <p className="text-slate-900 font-semibold mt-1">{profileForm.email}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-slate-500">Phone</p>
              <p className="text-slate-900 font-semibold mt-1">{profileForm.phone}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-slate-500">Residence</p>
              <p className="text-slate-900 font-semibold mt-1">{profileForm.residence}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-slate-500">NIC</p>
              <p className="text-slate-900 font-semibold mt-1">{profileForm.nic}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => setActiveSection('personal')}
              className="w-full px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg text-left"
            >
              View Personal Information
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('password')}
              className="w-full px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg text-left"
            >
              Change Password
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full px-4 py-2 text-xs font-semibold text-red-600 border border-red-200 rounded-lg text-left"
            >
              Logout
            </button>
          </div>

          {activeSection === 'personal' && (
            <form onSubmit={handleProfileSubmit} className="mt-6 grid grid-cols-2 gap-4 text-xs">
              <div className="col-span-2">
                <label className="text-slate-600 font-semibold">Full Name</label>
                <input
                  name="name"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold">Email</label>
                <input
                  name="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold">Phone</label>
                <input
                  name="phone"
                  value={profileForm.phone}
                  onChange={handleProfileChange}
                  className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold">Residence</label>
                <input
                  name="residence"
                  value={profileForm.residence}
                  onChange={handleProfileChange}
                  className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold">NIC</label>
                <input
                  name="nic"
                  value={profileForm.nic}
                  onChange={handleProfileChange}
                  className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700"
                />
              </div>
              <div className="col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {activeSection === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-3 text-xs">
              <div>
                <label className="text-slate-600 font-semibold">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700"
                />
              </div>
              {passwordError && <p className="text-[10px] text-red-600">{passwordError}</p>}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg"
                >
                  Update Password
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
