import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import Logo from '../components/Logo';
import { buildFileUrl, getUserProfileImage } from '../utils/profileImage';
import Dialog from '../components/Dialog';

const getTenantResidence = (user) => ({
  buildingName: user?.building?.name || user?.building?.buildingName || user?.buildingName || '',
  unitNumber: user?.unit || user?.unitNumber || user?.apartmentNumber || '',
  floorNumber: user?.floor !== undefined && user?.floor !== null
    ? String(user.floor)
    : user?.floorNumber || '',
});

export default function Profile() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const [activeSection, setActiveSection] = useState('personal');
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    buildingName: '',
    unitNumber: '',
    apartmentNumber: '',
    floorNumber: '',
    nic: '',
    profilePhoto: null,
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
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'success' });
  const [profileImage, setProfileImage] = useState('');
  const [residenceInfo, setResidenceInfo] = useState({
    buildingName: '',
    unitNumber: '',
    floorNumber: '',
  });

  useEffect(() => {
    if (role !== 'tenant') {
      navigate('/login');
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
          const tenantResidence = getTenantResidence(user);
          setProfileForm({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            apartmentNumber: user.apartmentNumber || '',
            nic: user.nic || '',
          });
          setProfileImage(getUserProfileImage(user));
          setResidenceInfo(tenantResidence);
        }
      } catch (error) {
        if (isActive) {
          setProfileError('Failed to load profile.');
        }
      } finally {
        if (isActive) {
          setProfileLoading(false);
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

  const handleProfileChange = (event) => {
    const { name, value, type, files } = event.target;
    if (type === 'file') {
      setProfileForm((prev) => ({ ...prev, [name]: files ? files[0] : null }));
    } else {
      setProfileForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = (event) => {
    event.preventDefault();
    setProfileError('');
    setDialog({ ...dialog, isOpen: false });

    const saveProfile = async () => {
      setProfileSaving(true);
      try {
        // Use FormData to support file upload
        const payload = new FormData();
        payload.append('name', profileForm.name);
        payload.append('email', profileForm.email);
        payload.append('phone', profileForm.phone);
        payload.append('buildingName', residenceInfo.buildingName);
        payload.append('unitNumber', residenceInfo.unitNumber);
        payload.append('apartmentNumber', profileForm.apartmentNumber);
        payload.append('floorNumber', residenceInfo.floorNumber);
        payload.append('nic', profileForm.nic);

        // Append profile photo if selected
        if (profileForm.profilePhoto) {
          payload.append('profilePhoto', profileForm.profilePhoto);
        }

        const response = await authAPI.updateProfile(payload);
        const user = response?.data?.user;

        if (user) {
          const tenantResidence = getTenantResidence(user);
          setProfileForm({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            apartmentNumber: user.apartmentNumber || '',
            nic: user.nic || '',
            profilePhoto: null,
          });
          setProfileImage(getUserProfileImage(user));
          setResidenceInfo(tenantResidence);
        }

        setDialog({ isOpen: true, title: 'Success', message: 'Profile updated successfully.', type: 'success' });
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
      setDialog({ isOpen: true, title: 'Success', message: 'Password updated successfully.', type: 'success' });
    } catch (error) {
      setPasswordError(error.response?.data?.message || 'Failed to update password.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Logo size={32} textClassName="text-lg font-bold text-gray-900" />
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
          {profileError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs">
              {profileError}
            </div>
          )}
          <Dialog
            isOpen={dialog.isOpen}
            title={dialog.title}
            message={dialog.message}
            type={dialog.type}
            onClose={() => setDialog({ ...dialog, isOpen: false })}
          />
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              {profileImage ? (
                <img
                  src={buildFileUrl(profileImage)}
                  alt={profileForm.name || 'Tenant'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                profileForm.name ? profileForm.name.charAt(0).toUpperCase() : 'T'
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {profileForm.name || (profileLoading ? 'Loading...' : 'Tenant')}
              </h1>
              <p className="text-xs text-slate-500">Tenant Profile</p>
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
              <p className="text-slate-500">Building Name</p>
              <p className="text-slate-900 font-semibold mt-1">{residenceInfo.buildingName || '-'}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-slate-500">Unit Number</p>
              <p className="text-slate-900 font-semibold mt-1">{residenceInfo.unitNumber || '-'}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 col-span-2 sm:col-span-1">
              <p className="text-slate-500">Floor</p>
              <p className="text-slate-900 font-semibold mt-1">{residenceInfo.floorNumber || '-'}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 col-span-2">
              <p className="text-slate-500">NIC</p>
              <p className="text-slate-900 font-semibold mt-1">{profileForm.nic || '-'}</p>
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
                <label className="text-slate-600 font-semibold">Building Name</label>
                <input
                  value={residenceInfo.buildingName}
                  readOnly
                  tabIndex={-1}
                  className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-500 bg-slate-100 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold">Unit Number</label>
                <input
                  value={residenceInfo.unitNumber}
                  readOnly
                  tabIndex={-1}
                  className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-500 bg-slate-100 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold">Apartment Number</label>
                <input
                  name="apartmentNumber"
                  value={profileForm.apartmentNumber}
                  onChange={handleProfileChange}
                  className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold">Floor Number</label>
                <input
                  value={residenceInfo.floorNumber}
                  readOnly
                  tabIndex={-1}
                  className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-500 bg-slate-100 cursor-not-allowed"
                />
              </div>
              <div className="col-span-2">
                <label className="text-slate-600 font-semibold">NIC</label>
                <input
                  name="nic"
                  value={profileForm.nic}
                  onChange={handleProfileChange}
                  className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700"
                />
              </div>
              <div className="col-span-2">
                <label className="text-slate-600 font-semibold">Profile Photo (Optional)</label>
                <input
                  type="file"
                  name="profilePhoto"
                  onChange={handleProfileChange}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700"
                />
                <p className="text-xs text-slate-500 mt-1">Allowed formats: JPG, PNG, GIF, WebP (Max 5MB)</p>
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
