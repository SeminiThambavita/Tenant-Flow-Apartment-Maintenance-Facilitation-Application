import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI, buildingAPI } from '../api';
import Logo from '../components/Logo';
import Dialog from '../components/Dialog';
import { validateTenantRegistration } from '../utils/tenantRegisterValidation';

function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs text-red-500 mt-1">{message}</p>;
}

export default function Register() {
  const [userType, setUserType] = useState('tenant');
  const [buildings, setBuildings] = useState([]);
  const [loadingBuildings, setLoadingBuildings] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    nic: '',
    buildingId: '',
    floor: '',
    unit: '',
    moveInDate: '',
    primaryContactName: '',
    primaryContactPhone: '',
    securityQuestion: 'What street did you grow up on?',
    securityAnswer: '',
    profilePhoto: null,
  });
  const [floors, setFloors] = useState([]);
  const [units, setUnits] = useState([]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isResident, setIsResident] = useState(false);
  const [agreedToMaintenance, setAgreedToMaintenance] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'info', buttons: [] });
  const navigate = useNavigate();

  // Load buildings on mount
 useEffect(() => {
  const loadBuildings = async () => {
    try {
      const response = await buildingAPI.getAll();

      const data = response.data;

      setBuildings(
        Array.isArray(data)
          ? data
          : data.buildings || []
      );
    } catch (err) {
      console.error('Failed to load buildings:', err);
      setError('Failed to load buildings. Please refresh the page.');
    } finally {
      setLoadingBuildings(false);
    }
  };

  loadBuildings();
}, []);

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (type === 'file') {
      setFormData({ ...formData, [name]: files ? files[0] : null });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleBuildingChange = (e) => {
    const buildingId = e.target.value;
    setFormData({ ...formData, buildingId, floor: '', unit: '' });
    setUnits([]);

    if (buildingId) {
      const building = buildings.find(b => b._id === buildingId);
      if (building) {
        setFloors(building.floors.map(f => f.floorNumber).sort((a, b) => a - b));
      }
    } else {
      setFloors([]);
    }
  };

  const handleFloorChange = (e) => {
    const floorNumber = Number(e.target.value);
    setFormData({ ...formData, floor: floorNumber, unit: '' });

    if (formData.buildingId && floorNumber) {
      const building = buildings.find(b => b._id === formData.buildingId);
      if (building) {
        const floor = building.floors.find(f => f.floorNumber === floorNumber);
        if (floor) {
          // Show only available units (not occupied)
          const availableUnits = floor.units.filter(u => !u.occupied);
          setUnits(availableUnits.map(u => u.unitNumber));
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.buildingId || !formData.floor || !formData.unit) {
      setError('Please select a building, floor, and unit.');
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      // Create FormData to support file upload
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('email', formData.email);
      payload.append('password', formData.password);
      payload.append('phone', formData.phone);
      payload.append('nic', formData.nic);
      payload.append('buildingId', formData.buildingId);
      payload.append('floor', Number(formData.floor));
      payload.append('unit', formData.unit);

      // Append profile photo if selected
      if (formData.profilePhoto) {
        payload.append('profilePhoto', formData.profilePhoto);
      }

      await authAPI.tenantRegister(payload);
      setDialog({
        isOpen: true,
        title: '✓ Registration Successful!',
        message: 'Your tenant account has been created. You can now sign in with your email and password.',
        type: 'success',
        buttons: [
          {
            label: 'Go to Login',
            onClick: () => navigate('/role-selection'),
            closeDialog: true
          }
        ]
      });
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setDialog({
        isOpen: true,
        title: 'Registration Failed',
        message: errorMessage,
        type: 'error',
        buttons: [
          {
            label: 'Try Again',
            onClick: () => {},
            closeDialog: true
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <Dialog 
        isOpen={dialog.isOpen}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        buttons={dialog.buttons}
        onClose={() => setDialog({ ...dialog, isOpen: false })}
      />
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Logo className="justify-center mb-3" textClassName="text-3xl font-bold text-gray-900" />
          <h2 className="text-2xl font-semibold text-gray-800 mt-2">Register as Tenant</h2>
          <p className="text-gray-600 mt-2">
            Report issues, track repairs, and manage payments, all in one place.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-8 shadow-sm space-y-8">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Personal Information <span className="text-red-500">*</span>
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className={`w-full px-4 py-2 border rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 ${
                    fieldErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  required
                />
                <FieldError message={fieldErrors.name} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="example@email.com"
                  autoComplete="off"
                  className={`w-full px-4 py-2 border rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 ${
                    fieldErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  required
                />
                <FieldError message={fieldErrors.email} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="0771234567"
                  className={`w-full px-4 py-2 border rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 ${
                    fieldErrors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  required
                />
                <FieldError message={fieldErrors.phone} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NIC / National ID Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nic"
                  value={formData.nic}
                  onChange={handleInputChange}
                  placeholder="123456789V or 200012345678"
                  className={`w-full px-4 py-2 border rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 ${
                    fieldErrors.nic ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  required
                />
                <FieldError message={fieldErrors.nic} />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Profile Photo (Optional)
                </label>
                <input
                  type="file"
                  name="profilePhoto"
                  onChange={handleInputChange}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Allowed formats: JPG, PNG, GIF, WebP (Max 5MB)</p>
              </div>
            </div>
          </div>

          {/* Apartment Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Apartment Details <span className="text-red-500">*</span>
            </h3>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Building <span className="text-red-500">*</span>
                </label>
                {loadingBuildings ? (
                  <p className="text-gray-500">Loading buildings...</p>
                ) : (
                  <select
                    name="buildingId"
                    value={formData.buildingId}
                    onChange={handleBuildingChange}
                    className={`w-full px-4 py-2 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 ${
                      fieldErrors.buildingId ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    required
                  >
                    <option value="">Select a Building</option>
                    {buildings.map((building) => (
                      <option key={building._id} value={building._id}>
                        {building.name} ({building.address}, {building.city})
                      </option>
                    ))}
                  </select>
                )}
                <FieldError message={fieldErrors.buildingId} />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Floor <span className="text-red-500">*</span>
                </label>
                <select
                  name="floor"
                  value={formData.floor}
                  onChange={handleFloorChange}
                  disabled={!formData.buildingId}
                  className={`w-full px-4 py-2 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 ${
                    !formData.buildingId ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300 focus:ring-blue-500'
                  } ${fieldErrors.floor ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                  required
                >
                  <option value="">Select a Floor</option>
                  {floors.map((floor) => (
                    <option key={floor} value={floor}>
                      Floor {floor}
                    </option>
                  ))}
                </select>
                <FieldError message={fieldErrors.floor} />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit <span className="text-red-500">*</span>
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  disabled={!formData.floor || units.length === 0}
                  className={`w-full px-4 py-2 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 ${
                    !formData.floor || units.length === 0 ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300 focus:ring-blue-500'
                  } ${fieldErrors.unit ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                  required
                >
                  <option value="">
                    {units.length === 0 ? 'No available units' : 'Select a Unit'}
                  </option>
                  {units.map((unit) => (
                    <option key={unit} value={unit}>
                      Unit {unit}
                    </option>
                  ))}
                </select>
                {units.length === 0 && formData.floor && (
                  <p className="text-xs text-red-500 mt-1">No available units on this floor. Please select a different floor.</p>
                )}
                <FieldError message={fieldErrors.unit} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Move-in Date
              </label>
              <input
                type="date"
                name="moveInDate"
                value={formData.moveInDate}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Emergency Contacts */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Emergency Contacts <span className="text-red-500">*</span>
            </h3>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Emergency Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="primaryContactName"
                  value={formData.primaryContactName}
                  onChange={handleInputChange}
                  placeholder="Enter contact's name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Emergency Contact Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="primaryContactPhone"
                  value={formData.primaryContactPhone}
                  onChange={handleInputChange}
                  placeholder="Enter contact's phone"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Account Security */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Account Security <span className="text-red-500">*</span>
            </h3>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a password (minimum 8 characters)"
                  autoComplete="new-password"
                  className={`w-full px-4 py-2 border rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 ${
                    fieldErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  required
                />
                <FieldError message={fieldErrors.password} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  className={`w-full px-4 py-2 border rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 ${
                    fieldErrors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  required
                />
                <FieldError message={fieldErrors.confirmPassword} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Security Question <span className="text-red-500">*</span>
                </label>
                <select
                  name="securityQuestion"
                  value={formData.securityQuestion}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option>What street did you grow up on?</option>
                  <option>What was your first pet's name?</option>
                  <option>What is your mother's maiden name?</option>
                  <option>What city were you born in?</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Security Answer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="securityAnswer"
                  value={formData.securityAnswer}
                  onChange={handleInputChange}
                  placeholder="Enter your answer"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Agreement */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Agreement <span className="text-red-500">*</span>
            </h3>
            <div className="space-y-4">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={isResident}
                  onChange={(e) => setIsResident(e.target.checked)}
                  className={`mt-1 w-4 h-4 rounded ${
                    fieldErrors.agreements ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <span className="ml-2 text-sm text-gray-700">
                  I verify I am a resident of this property. <span className="text-red-500">*</span>
                </span>
              </label>
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className={`mt-1 w-4 h-4 rounded ${
                    fieldErrors.agreements ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <span className="ml-2 text-sm text-gray-700">
                  I agree to the{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-700">
                    Terms of Service
                  </a>
                  {' '}and{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-700">
                    Privacy Policy
                  </a>
                  <span className="text-red-500"> *</span>
                </span>
              </label>
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={agreedToMaintenance}
                  onChange={(e) => setAgreedToMaintenance(e.target.checked)}
                  className={`mt-1 w-4 h-4 rounded ${
                    fieldErrors.agreements ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <span className="ml-2 text-sm text-gray-700">
                  I consent to authorized maintenance staff accessing my unit for approved repairs.
                  <span className="text-red-500"> *</span>
                </span>
              </label>
              {fieldErrors.agreements && (
                <p className="text-xs text-red-500 -mt-2">{fieldErrors.agreements}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Create Tenant Account'}
          </button>

          {/* Sign In Link */}
          <div className="text-center">
            <span className="text-gray-600 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign In
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
