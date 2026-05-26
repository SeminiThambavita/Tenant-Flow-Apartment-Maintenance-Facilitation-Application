import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api';
import Logo from '../components/Logo';
import { validateTenantRegistration } from '../utils/tenantRegisterValidation';

function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs text-red-500 mt-1">{message}</p>;
}

export default function Register() {
  const [userType, setUserType] = useState('tenant');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    nic: '',
    buildingName: '',
    unitNumber: '',
    floorNumber: '',
    moveInDate: '',
    primaryContactName: '',
    primaryContactPhone: '',
    securityQuestion: 'What street did you grow up on?',
    securityAnswer: '',
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isResident, setIsResident] = useState(false);
  const [agreedToMaintenance, setAgreedToMaintenance] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationErrors = validateTenantRegistration({
      ...formData,
      isResident,
      agreedToTerms,
      agreedToMaintenance
    });

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setError(validationErrors.agreements || 'Please fix the highlighted fields.');
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const data = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        nic: formData.nic,
        buildingName: formData.buildingName,
        unitNumber: formData.unitNumber,
        floorNumber: formData.floorNumber,
        profileImage: 'https://via.placeholder.com/150',
      };

      await authAPI.tenantRegister(data);
      alert('Tenant registered successfully! You can now sign in.');
      navigate('/login', { state: { role: 'tenant' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
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
                  Building/Complex Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="buildingName"
                  value={formData.buildingName}
                  onChange={handleInputChange}
                  placeholder="e.g. Celestial Towers"
                  className={`w-full px-4 py-2 border rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 ${
                    fieldErrors.buildingName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  required
                />
                <FieldError message={fieldErrors.buildingName} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="unitNumber"
                  value={formData.unitNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. A-12"
                  className={`w-full px-4 py-2 border rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 ${
                    fieldErrors.unitNumber ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  required
                />
                <FieldError message={fieldErrors.unitNumber} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Floor Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="floorNumber"
                  value={formData.floorNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. 12"
                  className={`w-full px-4 py-2 border rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 ${
                    fieldErrors.floorNumber ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  required
                />
                <FieldError message={fieldErrors.floorNumber} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Move-in Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="moveInDate"
                value={formData.moveInDate}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
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
