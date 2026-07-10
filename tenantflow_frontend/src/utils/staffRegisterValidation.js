const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(?:\+94|0)?7[0-9]{8}$/;
const NIC_REGEX = /^(?:\d{9}[vVxX]|\d{12})$/;
const ACCOUNT_NUMBER_REGEX = /^\d{8,18}$/;

export function validateStaffRegistration(formData) {
  const errors = {};

  const fullName = String(formData.fullName || '').trim();
  if (!fullName) {
    errors.fullName = 'Full name is required.';
  } else if (fullName.length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.';
  }

  const email = String(formData.email || '').trim();
  if (!email) {
    errors.email = 'Email address is required.';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  const phone = String(formData.phone || '').replace(/\s/g, '');
  if (!phone) {
    errors.phone = 'Phone number is required.';
  } else if (!PHONE_REGEX.test(phone)) {
    errors.phone = 'Enter a valid Sri Lankan mobile number (e.g. 0771234567).';
  }

  const nationalId = String(formData.nationalId || '').trim();
  if (!nationalId) {
    errors.nationalId = 'NIC / National ID is required.';
  } else if (!NIC_REGEX.test(nationalId)) {
    errors.nationalId = 'Enter a valid NIC (9 digits + V/X or 12 digits).';
  }

  if (!formData.primaryDepartment) {
    errors.primaryDepartment = 'Select a primary department.';
  }

  const maxJobs = Number(formData.maxJobsPerDay);
  if (!maxJobs || maxJobs < 1 || maxJobs > 10) {
    errors.maxJobsPerDay = 'Maximum jobs per day must be between 1 and 10.';
  }

  if (!formData.availableWeekdaysFrom || !formData.availableWeekdaysTo) {
    errors.availableWeekdays = 'Weekday available hours are required.';
  } else if (formData.availableWeekdaysFrom >= formData.availableWeekdaysTo) {
    errors.availableWeekdays = 'Weekday end time must be after start time.';
  }

  const weekendFrom = String(formData.availableWeekendsFrom || '').trim();
  const weekendTo = String(formData.availableWeekendsTo || '').trim();
  if ((weekendFrom && !weekendTo) || (!weekendFrom && weekendTo)) {
    errors.availableWeekends = 'Provide both weekend start and end times, or leave both empty.';
  } else if (weekendFrom && weekendTo && weekendFrom >= weekendTo) {
    errors.availableWeekends = 'Weekend end time must be after start time.';
  }

  const bankName = String(formData.bankName || '').trim();
  if (!bankName) {
    errors.bankName = 'Bank name is required.';
  } else if (bankName.length < 2) {
    errors.bankName = 'Enter a valid bank name.';
  }

  const branchName = String(formData.branchName || '').trim();
  if (!branchName) {
    errors.branchName = 'Branch name is required.';
  }

  const accountNumber = String(formData.accountNumber || '').trim();
  if (!accountNumber) {
    errors.accountNumber = 'Account number is required.';
  } else if (!ACCOUNT_NUMBER_REGEX.test(accountNumber)) {
    errors.accountNumber = 'Account number must be 8–18 digits.';
  }

  const accountHolderName = String(formData.accountHolderName || '').trim();
  if (!accountHolderName) {
    errors.accountHolderName = 'Account holder name is required.';
  }

  const branchCode = String(formData.branchCode || '').trim();
  if (!branchCode) {
    errors.branchCode = 'Branch code is required.';
  }

  const password = String(formData.password || '');
  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  if (!formData.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.';
  } else if (password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  if (!formData.profilePhoto) {
    errors.profilePhoto = 'Profile photo is required.';
  }

  if (
    !formData.agreeBackgroundCheck ||
    !formData.agreeTerms ||
    !formData.agreeTax ||
    !formData.agreeProfessional
  ) {
    errors.agreements = 'You must accept all agreements to register as staff.';
  }

  return errors;
}
