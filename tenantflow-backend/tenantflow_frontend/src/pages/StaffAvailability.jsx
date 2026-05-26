import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import StaffNav from '../components/StaffNav';

export default function StaffAvailability() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const [profile, setProfile] = useState({
    name: 'Staff Member',
    availableWeekdaysFrom: '',
    availableWeekdaysTo: '',
    availableWeekendsFrom: '',
    availableWeekendsTo: '',
    workStatus: '',
  });
  const [scheduleForm, setScheduleForm] = useState({
    availableWeekdaysFrom: '',
    availableWeekdaysTo: '',
    availableWeekendsFrom: '',
    availableWeekendsTo: '',
  });
  const [isOnline, setIsOnline] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (role !== 'staff') {
      navigate('/login', { state: { role: 'staff' } });
      return;
    }

    const loadProfile = async () => {
      try {
        const response = await authAPI.getProfile();
        const currentUser = response?.data?.user || {};
        setProfile({
          name: currentUser.name || 'Staff Member',
          availableWeekdaysFrom: currentUser.availableWeekdaysFrom || '',
          availableWeekdaysTo: currentUser.availableWeekdaysTo || '',
          availableWeekendsFrom: currentUser.availableWeekendsFrom || '',
          availableWeekendsTo: currentUser.availableWeekendsTo || '',
          workStatus: currentUser.workStatus || '',
        });
        setScheduleForm({
          availableWeekdaysFrom: currentUser.availableWeekdaysFrom || '',
          availableWeekdaysTo: currentUser.availableWeekdaysTo || '',
          availableWeekendsFrom: currentUser.availableWeekendsFrom || '',
          availableWeekendsTo: currentUser.availableWeekendsTo || '',
        });
        setIsOnline(currentUser.isOnline !== false);
      } catch {
        // keep fallback values
      }
    };

    loadProfile();
  }, [navigate, role]);

  const persistProfile = async (payload) => {
    setSaving(true);
    setSaveMessage('');
    try {
      const response = await authAPI.updateProfile(payload);
      const user = response?.data?.user || {};
      setProfile((prev) => ({
        ...prev,
        ...user,
        name: user.name || prev.name,
      }));
      if (user.isOnline !== undefined) setIsOnline(user.isOnline !== false);
      setSaveMessage('Saved successfully.');
    } catch (error) {
      setSaveMessage(error.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleOnlineToggle = async () => {
    const next = !isOnline;
    setIsOnline(next);
    await persistProfile({ isOnline: next });
  };

  const handleScheduleSave = async (event) => {
    event.preventDefault();
    await persistProfile(scheduleForm);
    setProfile((prev) => ({ ...prev, ...scheduleForm }));
  };

  const formatTimeRange = () => {
    const from = profile.availableWeekdaysFrom || 'N/A';
    const to = profile.availableWeekdaysTo || 'N/A';
    return `${from} - ${to}`;
  };

  const formatWeekendRange = () => {
    const from = profile.availableWeekendsFrom || 'N/A';
    const to = profile.availableWeekendsTo || 'N/A';
    return `${from} - ${to}`;
  };

  const hasWeekendSchedule = Boolean(profile.availableWeekendsFrom && profile.availableWeekendsTo);

  return (
    <div className="min-h-screen bg-[#F4F5F9] text-[#171A2A]">
      <StaffNav active="availability" profileName={profile.name} showBack backPath="/staff-dashboard" />

      <main className="max-w-[700px] mx-auto pt-10 px-4 pb-10 text-center">
        <h1 className="text-3xl md:text-4xl leading-tight font-semibold">Availability</h1>
        <p className="text-sm text-[#646FB1] mt-2 mb-6">Control your real-time status and view your shift details.</p>

        {saveMessage && (
          <p className="mb-4 text-xs font-medium text-[#3346F2]">{saveMessage}</p>
        )}

        <div className="bg-white rounded-2xl border border-[#D9DEEC] shadow-sm px-8 py-7 text-left">
          <p className="text-[12px] tracking-[0.25em] font-semibold text-[#7783AE] text-center">CURRENT STATUS</p>
          <p className={`text-3xl font-semibold text-center mt-2 ${isOnline ? 'text-[#20BE5D]' : 'text-[#E05353]'}`}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </p>

          <div className="flex justify-center mt-3">
            <button
              type="button"
              onClick={handleOnlineToggle}
              disabled={saving}
              className={`w-20 h-11 rounded-full px-1 flex items-center transition ${isOnline ? 'bg-[#20BE5D]' : 'bg-[#CBD2E3]'} disabled:opacity-70`}
            >
              <span className={`w-9 h-9 rounded-full bg-white transition ${isOnline ? 'translate-x-9' : 'translate-x-0'}`} />
            </button>
          </div>

          <p className="text-xs text-[#6B77AB] text-center mt-4">
            When <span className="font-semibold">{isOnline ? 'Online' : 'Offline'}</span>, you will {isOnline ? 'be dispatched new work orders and visible to the Property Manager.' : 'not receive new dispatches until you are back online.'}
          </p>

          <div className="mt-7 pt-6 border-t border-[#DEE3F0] grid grid-cols-2 gap-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#E9EDFF] text-[#3F46F0] flex items-center justify-center">◌</div>
              <div>
                <p className="text-base font-semibold">Standard Hours</p>
                <p className="text-sm text-[#6673A9]">Monday - Friday</p>
                <p className="text-2xl font-semibold leading-tight">{formatTimeRange()}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#E9EDFF] text-[#3F46F0] flex items-center justify-center">▦</div>
              <div>
                <p className="text-base font-semibold">Weekend Status</p>
                <p className="text-sm text-[#6673A9]">Saturday - Sunday</p>
                <p className={`text-2xl font-semibold leading-tight ${hasWeekendSchedule ? 'text-[#20BE5D]' : 'text-[#E14848]'}`}>
                  {hasWeekendSchedule ? formatWeekendRange() : 'OFF DUTY'}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleScheduleSave} className="mt-6 pt-6 border-t border-[#DEE3F0] space-y-3 text-xs">
            <p className="text-sm font-semibold text-[#2A2E3F]">Edit schedule (saved to your account)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#6673A9]">Weekdays from</label>
                <input
                  type="time"
                  value={scheduleForm.availableWeekdaysFrom}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, availableWeekdaysFrom: e.target.value }))}
                  className="mt-1 w-full border border-[#D9DEEC] rounded-lg px-2 py-1.5"
                />
              </div>
              <div>
                <label className="text-[#6673A9]">Weekdays to</label>
                <input
                  type="time"
                  value={scheduleForm.availableWeekdaysTo}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, availableWeekdaysTo: e.target.value }))}
                  className="mt-1 w-full border border-[#D9DEEC] rounded-lg px-2 py-1.5"
                />
              </div>
              <div>
                <label className="text-[#6673A9]">Weekends from</label>
                <input
                  type="time"
                  value={scheduleForm.availableWeekendsFrom}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, availableWeekendsFrom: e.target.value }))}
                  className="mt-1 w-full border border-[#D9DEEC] rounded-lg px-2 py-1.5"
                />
              </div>
              <div>
                <label className="text-[#6673A9]">Weekends to</label>
                <input
                  type="time"
                  value={scheduleForm.availableWeekendsTo}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, availableWeekendsTo: e.target.value }))}
                  className="mt-1 w-full border border-[#D9DEEC] rounded-lg px-2 py-1.5"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#3F46F0] text-white rounded-lg font-semibold disabled:opacity-70"
            >
              {saving ? 'Saving...' : 'Save Schedule'}
            </button>
          </form>
        </div>

        <div className="mt-5 inline-flex items-center gap-2 border border-[#CDD5F0] bg-[#EFF2FF] rounded-xl px-4 py-2 text-xs text-[#5867A9]">
          <span>◉</span>
          <span>Manager View:</span>
          <span className="font-semibold text-[#3346F2]">{isOnline ? 'Visible & Active' : 'Temporarily Unavailable'}</span>
        </div>
      </main>
    </div>
  );
}
