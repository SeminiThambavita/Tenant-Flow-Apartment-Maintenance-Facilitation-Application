import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

function RoleSelection() {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'tenant',
      title: "I'm a Tenant",
      description: 'Report issues, track repairs, and make payments.',
      icon: 'user',
      buttonText: 'Login as Tenant',
      buttonAction: () => navigate('/login', { state: { role: 'tenant' } }),
      registerAction: () => navigate('/register', { state: { role: 'tenant' } }),
      showRegister: true
    },
    {
      id: 'staff',
      title: "I'm Maintenance Staff",
      description: 'Receive tasks, update work status, and submit cost reports.',
      icon: 'wrench',
      buttonText: 'Login as Staff',
      buttonAction: () => navigate('/login', { state: { role: 'staff' } }),
      registerAction: () => navigate('/register-staff'),
      showRegister: true
    },
    {
      id: 'manager',
      title: "I'm a Property Manager",
      description: 'Assign tasks, monitor progress, and manage properties.',
      icon: 'briefcase',
      buttonText: 'Login as Manager',
      buttonAction: () => navigate('/login', { state: { role: 'admin' } }),
      showRegister: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      {/* Back Button */}
      <div className="absolute top-6 left-6">
        <button
          onClick={() => navigate('/')}
          className="text-gray-600 hover:text-gray-900 transition-colors"
          title="Back to home"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
      </div>

      {/* Header */}
      <div className="text-center mb-12 mt-4">
        <div className="flex justify-center mb-4">
          <Logo size={48} textClassName="text-3xl font-bold text-gray-900" />
        </div>
        <p className="text-gray-500 text-lg">Your Centralized Maintenance Solution</p>
      </div>

      {/* Role Cards */}
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {roles.map((role) => (
          <div
            key={role.id}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 p-8 flex flex-col items-center text-center"
          >
            {/* Icon */}
            <div className="mb-4">
              {role.icon === 'user' && (
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM6 20h12a6 6 0 00-6-6H6a6 6 0 00-6 6v2h5v-2a3 3 0 013-3z" />
                </svg>
              )}
              {role.icon === 'wrench' && (
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              )}
              {role.icon === 'briefcase' && (
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m0 0v10l8 4" />
                </svg>
              )}
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-gray-900 mb-3">{role.title}</h2>

            {/* Description */}
            <p className="text-gray-600 text-sm mb-6 flex-grow">{role.description}</p>

            {/* Button */}
            <button
              onClick={role.buttonAction}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-300"
            >
              {role.buttonText}
            </button>

            {/* Register Link - Only for Tenant and Staff */}
            {role.showRegister && (
              <p className="text-sm text-gray-600 mt-4">
                <a
                  onClick={role.registerAction}
                  className="text-blue-600 hover:underline font-semibold cursor-pointer"
                >
                  Register
                </a>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default RoleSelection;
