import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Logo from '../components/Logo';

export default function StaffDashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');

  useEffect(() => {
    if (role !== 'staff') {
      navigate('/login');
    }
  }, [role, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Logo size={36} textClassName="text-2xl font-bold text-gray-900" />
          <button
            onClick={handleLogout}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Staff Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition cursor-pointer">
            <div className="text-4xl font-bold text-red-600 mb-2">8</div>
            <p className="text-gray-600">Pending Issues</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition cursor-pointer">
            <div className="text-4xl font-bold text-blue-600 mb-2">12</div>
            <p className="text-gray-600">Assigned Tasks</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition cursor-pointer">
            <div className="text-4xl font-bold text-green-600 mb-2">95%</div>
            <p className="text-gray-600">Completion Rate</p>
          </div>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-left">
              📋 View Issues
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-left">
              ✓ Update Tasks
            </button>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-left">
              📧 Messages
            </button>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-left">
              👤 Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
