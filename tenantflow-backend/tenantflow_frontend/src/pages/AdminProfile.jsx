import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminProfile() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const [activeSection, setActiveSection] = useState('personal');
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/login', { state: { role: 'admin' } });
    }
  }, [role, navigate]);

  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      setProfileLoading(true);
      setProfileError('');
      try {
        const response = await authAPI.getProfile();
        const user = response?.data?.user;
        if (isActive && user) {
          setProfileForm({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
          });
        }
      } catch {
        if (isActive) setProfileError('Failed to load profile.');
      } finally {
        if (isActive) setProfileLoading(false);
      }
    };

    if (role === 'admin') loadProfile();
    return () => { isActive = false; };
  }, [role]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/role-selection');
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileSaving(true);
    try {
      const response = await authAPI.updateProfile(profileForm);
      const user = response?.data?.user;
      if (user) {
        setProfileForm({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
        });
      }
      setProfileSuccess('Profile updated successfully.');
    } catch (error) {
      setProfileError(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setPasswordError('');
    try {
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setProfileSuccess('Password updated successfully.');
    } catch (error) {
      setPasswordError(error.response?.data?.message || 'Failed to update password.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F9] flex">
      <AdminSidebar active="profile" profileName={profileForm.name || 'Property Manager'} />
      <main className="flex-1 p-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate('/admin-dashboard')}
            className="w-7 h-7 rounded-md border border-[#DCE0EE] text-[#596080] bg-white"
            title="Back to dashboard"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl font-semibold text-[#1F2233]">Profile Settings</h1>
            <p className="text-xs text-[#7681A8]">Update your property manager account</p>
          </div>
        </div>

        <div className="max-w-2xl bg-white border border-[#DDE2F0] rounded-xl shadow-sm p-6">
          {profileError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs">{profileError}</div>
          )}
          {profileSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded text-xs">{profileSuccess}</div>
          )}

          <div className="flex gap-3 mb-6">
            <button
              type="button"
              onClick={() => setActiveSection('personal')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md ${activeSection === 'personal' ? 'bg-[#ECEEFF] text-[#3346F2]' : 'bg-[#F6F7FB] text-[#2A2E3F]'}`}
            >
              Personal Info
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('password')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md ${activeSection === 'password' ? 'bg-[#ECEEFF] text-[#3346F2]' : 'bg-[#F6F7FB] text-[#2A2E3F]'}`}
            >
              Password
            </button>
          </div>

          {activeSection === 'personal' && (
            <form onSubmit={handleProfileSubmit} className="grid grid-cols-2 gap-4 text-xs">
              <div className="col-span-2">
                <label className="text-[#7079A3] font-semibold">Full Name</label>
                <input
                  name="name"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  className="mt-1 w-full border border-[#DDE2F0] rounded-md px-3 py-2 text-[11px]"
                />
              </div>
              <div>
                <label className="text-[#7079A3] font-semibold">Email</label>
                <input
                  name="email"
                  type="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  className="mt-1 w-full border border-[#DDE2F0] rounded-md px-3 py-2 text-[11px]"
                />
              </div>
              <div>
                <label className="text-[#7079A3] font-semibold">Phone</label>
                <input
                  name="phone"
                  value={profileForm.phone}
                  onChange={handleProfileChange}
                  className="mt-1 w-full border border-[#DDE2F0] rounded-md px-3 py-2 text-[11px]"
                />
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2 text-xs font-semibold text-red-600 border border-red-200 rounded-md"
                >
                  Logout
                </button>
                <button
                  type="submit"
                  disabled={profileLoading || profileSaving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#3346F2] rounded-md"
                >
                  {profileSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {activeSection === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-3 text-xs max-w-md">
              <div>
                <label className="text-[#7079A3] font-semibold">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  className="mt-1 w-full border border-[#DDE2F0] rounded-md px-3 py-2 text-[11px]"
                />
              </div>
              <div>
                <label className="text-[#7079A3] font-semibold">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className="mt-1 w-full border border-[#DDE2F0] rounded-md px-3 py-2 text-[11px]"
                />
              </div>
              <div>
                <label className="text-[#7079A3] font-semibold">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className="mt-1 w-full border border-[#DDE2F0] rounded-md px-3 py-2 text-[11px]"
                />
              </div>
              {passwordError && <p className="text-[10px] text-red-600">{passwordError}</p>}
              <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-[#3346F2] rounded-md">
                Update Password
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
