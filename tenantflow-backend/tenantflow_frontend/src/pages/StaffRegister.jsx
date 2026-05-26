import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import Logo from '../components/Logo';
import BankNameInput from '../components/BankNameInput';
import { validateStaffRegistration } from '../utils/staffRegisterValidation';

function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs text-red-500 mt-1">{message}</p>;
}

function StaffRegister() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    nationalId: '',
    primaryDepartment: '',
    secondarySkills: [],
    yearsOfExperience: 0,
    certifications: '',
    workStatus: 'full-time',
    maxJobsPerDay: 3,
    availableWeekdaysFrom: '09:00',
    availableWeekdaysTo: '17:00',
    availableWeekendsFrom: '',
    availableWeekendsTo: '',
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    branchCode: '',
    branchName: '',
    password: '',
    confirmPassword: '',
    profilePhoto: null,
    idDocument: null,
    agreeBackgroundCheck: false,
    agreeTerms: false,
    agreeTax: false,
    agreeProfessional: false
  });

  const [newSkill, setNewSkill] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    const { name, files } = event.target;
    const selectedFile = files && files[0] ? files[0] : null;
    setFormData((prev) => ({
      ...prev,
      [name]: selectedFile
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldName = name === 'staffRegistrationEmail' ? 'email' : name;
    if (fieldErrors[fieldName] || fieldErrors.agreements) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        delete next.agreements;
        delete next.availableWeekdays;
        delete next.availableWeekends;
        return next;
      });
    }
    setFormData(prev => ({
      ...prev,
      [fieldName]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setFormData(prev => ({
        ...prev,
        secondarySkills: [...prev.secondarySkills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      secondarySkills: prev.secondarySkills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationErrors = validateStaffRegistration(formData);
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setError(validationErrors.agreements || 'Please fix the highlighted fields.');
      return;
    }

    setFieldErrors({});

    try {
      setLoading(true);

      const payload = new FormData();
      payload.append('name', formData.fullName);
      payload.append('email', formData.email);
      payload.append('password', formData.password);
      payload.append('phone', formData.phone);
      payload.append('nationalId', formData.nationalId);
      payload.append('primaryDepartment', formData.primaryDepartment);
      payload.append('secondarySkills', JSON.stringify(formData.secondarySkills));
      payload.append('yearsOfExperience', String(formData.yearsOfExperience));
      payload.append('certifications', formData.certifications);
      payload.append('workStatus', formData.workStatus);
      payload.append('maxJobsPerDay', String(formData.maxJobsPerDay));
      payload.append('availableWeekdaysFrom', formData.availableWeekdaysFrom);
      payload.append('availableWeekdaysTo', formData.availableWeekdaysTo);
      payload.append('availableWeekendsFrom', formData.availableWeekendsFrom);
      payload.append('availableWeekendsTo', formData.availableWeekendsTo);
      payload.append('bankName', formData.bankName);
      payload.append('accountNumber', formData.accountNumber);
      payload.append('accountHolderName', formData.accountHolderName);
      payload.append('branchCode', formData.branchCode);
      payload.append('branchName', formData.branchName);
      payload.append('agreeBackgroundCheck', String(formData.agreeBackgroundCheck));
      payload.append('agreeTerms', String(formData.agreeTerms));
      payload.append('agreeTax', String(formData.agreeTax));
      payload.append('agreeProfessional', String(formData.agreeProfessional));

      if (formData.profilePhoto) {
        payload.append('profilePhoto', formData.profilePhoto);
      }

      if (formData.idDocument) {
        payload.append('idDocument', formData.idDocument);
      }

      await authAPI.staffRegister(payload);
      alert('Staff registration submitted successfully. Please wait for admin approval.');
      navigate('/login', { state: { role: 'staff' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Staff registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {/* Back Button */}
      <div className="absolute top-6 left-6">
        <button
          type="button"
          onClick={() => navigate('/role-selection')}
          className="text-sm font-semibold text-blue-600 hover:text-blue-800"
        >
          Back
        </button>
      </div>

      {/* Header */}
      <div className="max-w-2xl mx-auto text-center mb-8 flex flex-col items-center">
        <Logo size={40} textClassName="text-3xl font-bold text-gray-900" className="mb-2" />
        <h2 className="text-xl font-semibold text-gray-700">Register as Maintenance Staff</h2>
        <p className="text-gray-500 text-sm">Receive tasks, update status, earn tips</p>
      </div>

      {error && (
        <div className="max-w-2xl mx-auto mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6" autoComplete="off">
        {/* 1. Personal & Professional Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">1. Personal & Professional Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                autoComplete="off"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${fieldErrors.fullName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
              />
              <FieldError message={fieldErrors.fullName} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="staffRegistrationEmail"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                autoComplete="off"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${fieldErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
              />
              <FieldError message={fieldErrors.email} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="0771234567"
                autoComplete="off"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${fieldErrors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
              />
              <FieldError message={fieldErrors.phone} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NIC/National ID Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nationalId"
                value={formData.nationalId}
                onChange={handleInputChange}
                placeholder="123456789V or 200012345678"
                autoComplete="off"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${fieldErrors.nationalId ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
              />
              <FieldError message={fieldErrors.nationalId} />
            </div>
          </div>
        </div>

        {/* 2. Specialization & Skills */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">2. Specialization & Skills</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Department <span className="text-red-500">*</span>
                </label>
                <select
                  name="primaryDepartment"
                  value={formData.primaryDepartment}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${fieldErrors.primaryDepartment ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                >
                  <option value="">Select...</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                  <option value="carpentry">Carpentry</option>
                  <option value="hvac">HVAC</option>
                  <option value="painting">Painting</option>
                  <option value="general">General Maintenance</option>
                </select>
                <FieldError message={fieldErrors.primaryDepartment} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secondary Skills
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    placeholder="Add a skill..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.secondarySkills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-blue-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <FieldError message={fieldErrors.secondarySkills} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Years of Experience <span className="text-red-500">*</span>: <span className="text-blue-600">{formData.yearsOfExperience} years</span>
              </label>
              <input
                type="range"
                name="yearsOfExperience"
                min="0"
                max="30"
                value={formData.yearsOfExperience}
                onChange={handleInputChange}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0</span>
                <span>30+</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Certifications / Licenses</label>
              <textarea
                name="certifications"
                value={formData.certifications}
                onChange={handleInputChange}
                placeholder="e.g., Certified Electrician, Plumbing License #12345"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 3. Availability & Work Preferences */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">3. Availability & Work Preferences</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Work Status</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="workStatus"
                      value="full-time"
                      checked={formData.workStatus === 'full-time'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Full-time
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="workStatus"
                      value="part-time"
                      checked={formData.workStatus === 'part-time'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Part-time
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="workStatus"
                      value="on-call"
                      checked={formData.workStatus === 'on-call'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    On-call
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Jobs Per Day</label>
                <input
                  type="number"
                  name="maxJobsPerDay"
                  min="1"
                  max="10"
                  value={formData.maxJobsPerDay}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${fieldErrors.maxJobsPerDay ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                />
                <FieldError message={fieldErrors.maxJobsPerDay} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available Hours (Weekdays) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    name="availableWeekdaysFrom"
                    value={formData.availableWeekdaysFrom}
                    onChange={handleInputChange}
                    className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${fieldErrors.availableWeekdays ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                  />
                  <span>to</span>
                  <input
                    type="time"
                    name="availableWeekdaysTo"
                    value={formData.availableWeekdaysTo}
                    onChange={handleInputChange}
                    className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${fieldErrors.availableWeekdays ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                  />
                </div>
                <FieldError message={fieldErrors.availableWeekdays} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available Hours (Weekend) <span className="text-gray-400 text-xs font-normal">(optional)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    name="availableWeekendsFrom"
                    value={formData.availableWeekendsFrom}
                    onChange={handleInputChange}
                    className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${fieldErrors.availableWeekends ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                  />
                  <span>to</span>
                  <input
                    type="time"
                    name="availableWeekendsTo"
                    value={formData.availableWeekendsTo}
                    onChange={handleInputChange}
                    className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${fieldErrors.availableWeekends ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                  />
                </div>
                <FieldError message={fieldErrors.availableWeekends} />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Payment & Banking */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">4. Payment & Banking</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name <span className="text-red-500">*</span></label>
              <BankNameInput
                value={formData.bankName}
                onChange={(bankName) => {
                  setFormData((prev) => ({ ...prev, bankName }));
                  if (fieldErrors.bankName) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.bankName;
                      return next;
                    });
                  }
                }}
                error={fieldErrors.bankName}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="branchName"
                value={formData.branchName}
                onChange={handleInputChange}
                placeholder="e.g. Colombo Fort"
                autoComplete="off"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${fieldErrors.branchName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
              />
              <FieldError message={fieldErrors.branchName} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch Code <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="branchCode"
                value={formData.branchCode}
                onChange={handleInputChange}
                placeholder="Enter branch code"
                autoComplete="off"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${fieldErrors.branchCode ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
              />
              <FieldError message={fieldErrors.branchCode} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Number <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleInputChange}
                placeholder="Enter account number"
                autoComplete="off"
                inputMode="numeric"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${fieldErrors.accountNumber ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
              />
              <FieldError message={fieldErrors.accountNumber} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="accountHolderName"
                value={formData.accountHolderName}
                onChange={handleInputChange}
                placeholder="As it appears on your bank statement"
                autoComplete="off"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${fieldErrors.accountHolderName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
              />
              <FieldError message={fieldErrors.accountHolderName} />
            </div>
          </div>
        </div>

        {/* 5. Account Security */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">5. Account Security</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a strong password (min. 8 characters)"
                  autoComplete="new-password"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${fieldErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                />
                <FieldError message={fieldErrors.password} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${fieldErrors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                />
                <FieldError message={fieldErrors.confirmPassword} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Profile Photo & ID <span className="text-red-500">*</span></label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div className="mt-2 text-sm text-gray-600">
                  <label className="cursor-pointer text-blue-600 hover:underline mr-2">
                    <span>Browse profile photo</span>
                    <input
                      type="file"
                      name="profilePhoto"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                  <label className="cursor-pointer text-blue-600 hover:underline">
                    <span>Browse ID document</span>
                    <input
                      type="file"
                      name="idDocument"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">Supported formats: JPG, PNG, PDF</p>
                <FieldError message={fieldErrors.profilePhoto} />
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-700">
                    Profile Photo: {formData.profilePhoto ? formData.profilePhoto.name : 'Not selected'}
                  </p>
                  <p className="text-xs text-gray-700">
                    ID Document: {formData.idDocument ? formData.idDocument.name : 'Not selected'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Agreements */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">6. Agreements</h3>
          
          <div className="space-y-3">
            <FieldError message={fieldErrors.agreements} />
            <label className="flex items-start">
              <input
                type="checkbox"
                name="agreeBackgroundCheck"
                checked={formData.agreeBackgroundCheck}
                onChange={handleInputChange}
                className="mt-1 mr-3"
              />
              <span className="text-sm text-gray-700">
                I agree to a background check as part of the screening process.
              </span>
            </label>

            <label className="flex items-start">
              <input
                type="checkbox"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleInputChange}
                className="mt-1 mr-3"
              />
              <span className="text-sm text-gray-700">
                I have read and accept the{' '}
                <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and{' '}
                <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.
              </span>
            </label>

            <label className="flex items-start">
              <input
                type="checkbox"
                name="agreeTax"
                checked={formData.agreeTax}
                onChange={handleInputChange}
                className="mt-1 mr-3"
              />
              <span className="text-sm text-gray-700">
                I understand that any tips received are considered income and are subject to tax.
              </span>
            </label>

            <label className="flex items-start">
              <input
                type="checkbox"
                name="agreeProfessional"
                checked={formData.agreeProfessional}
                onChange={handleInputChange}
                className="mt-1 mr-3"
              />
              <span className="text-sm text-gray-700">
                I commit to maintaining professional conduct and delivering high-quality service at all times.
              </span>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="bg-white rounded-lg shadow p-6">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Join as Staff'}
          </button>
          <p className="text-center text-sm text-gray-600 mt-4">
            Registration requires admin approval. You will be notified via email within two business days.
          </p>
        </div>
      </form>
    </div>
  );
}

export default StaffRegister;
