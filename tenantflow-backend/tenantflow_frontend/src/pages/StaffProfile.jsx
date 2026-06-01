import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import StaffNav from '../components/StaffNav';
import { buildFileUrl, getUserProfileImage } from '../utils/profileImage';

export default function StaffProfile() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const [activeSection, setActiveSection] = useState('personal');
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    primaryDepartment: '',
    workStatus: '',
    yearsOfExperience: '',
  });
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
  const [profileImage, setProfileImage] = useState('');

  useEffect(() => {
    if (role !== 'staff') {
      navigate('/login', { state: { role: 'staff' } });
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
            primaryDepartment: user.primaryDepartment || user.staffType || '-',
            workStatus: user.workStatus || '-',
            yearsOfExperience: user.yearsOfExperience ?? 0,
          });
          setProfileImage(getUserProfileImage(user));
        }
      } catch {
        if (isActive) {
          setProfileError('Failed to load profile.');
        }
      } finally {
        if (isActive) {
          setProfileLoading(false);
        }
      }
    };

    if (role === 'staff') {
      loadProfile();
    }

    return () => {
      isActive = false;
    };
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

  const handleProfileSubmit = (event) => {
    event.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    const saveProfile = async () => {
      setProfileSaving(true);
      try {
        const payload = {
          name: profileForm.name,
          email: profileForm.email,
          phone: profileForm.phone,
          primaryDepartment: profileForm.primaryDepartment,
          workStatus: profileForm.workStatus,
          yearsOfExperience: profileForm.yearsOfExperience,
        };

        const response = await authAPI.updateProfile(payload);
        const user = response?.data?.user;

        if (user) {
          setProfileForm((prev) => ({
            ...prev,
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            primaryDepartment: user.primaryDepartment || user.staffType || prev.primaryDepartment,
            workStatus: user.workStatus || prev.workStatus,
            yearsOfExperience: user.yearsOfExperience ?? prev.yearsOfExperience,
          }));
          setProfileImage(getUserProfileImage(user));
        }

        setProfileSuccess('Profile updated successfully.');
      } catch (error) {
        setProfileError(error.response?.data?.message || 'Failed to update profile.');
      } finally {
        setProfileSaving(false);
      }
    };

    saveProfile();
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
    <div className="min-h-screen bg-slate-50">
      <StaffNav
        active="profile"
        profileName={profileForm.name}
        profileImage={profileImage}
        showBack
        backPath="/staff-dashboard"
      />

      <div className="max-w-3xl mx-auto px-6 py-6">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          {profileError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs">
              {profileError}
            </div>
          )}
          {profileSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded text-xs">
              {profileSuccess}
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              {profileImage ? (
                <img
                  src={buildFileUrl(profileImage)}
                  alt={profileForm.name || 'Staff Member'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                profileForm.name ? profileForm.name.charAt(0).toUpperCase() : 'S'
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {profileForm.name || (profileLoading ? 'Loading...' : 'Staff Member')}
              </h1>
              <p className="text-xs text-slate-500">Staff Profile</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-slate-500">Email</p>
              <p className="text-slate-900 font-semibold mt-1">{profileForm.email || '-'}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-slate-500">Phone</p>
              <p className="text-slate-900 font-semibold mt-1">{profileForm.phone || '-'}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-slate-500">Primary Department</p>
              <p className="text-slate-900 font-semibold mt-1">{profileForm.primaryDepartment || '-'}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-slate-500">Work Status</p>
              <p className="text-slate-900 font-semibold mt-1">{profileForm.workStatus || '-'}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 col-span-2">
              <p className="text-slate-500">Years of Experience</p>
              <p className="text-slate-900 font-semibold mt-1">{profileForm.yearsOfExperience}</p>
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
                <label className="text-slate-600 font-semibold">Primary Department</label>
                <input
                  name="primaryDepartment"
                  value={profileForm.primaryDepartment}
                  onChange={handleProfileChange}
                  className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold">Work Status</label>
                <select
                  name="workStatus"
                  value={profileForm.workStatus}
                  onChange={handleProfileChange}
                  className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700"
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="on-call">On-call</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-slate-600 font-semibold">Years of Experience</label>
                <input
                  type="number"
                  name="yearsOfExperience"
                  value={profileForm.yearsOfExperience}
                  onChange={handleProfileChange}
                  className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700"
                />
              </div>
              <div className="col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={profileLoading || profileSaving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg"
                >
                  {profileSaving ? 'Saving...' : profileLoading ? 'Loading...' : 'Save Changes'}
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
