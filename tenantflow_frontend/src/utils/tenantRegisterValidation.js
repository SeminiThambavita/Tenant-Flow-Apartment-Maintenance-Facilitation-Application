const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(?:\+94|0)?7[0-9]{8}$/;
const NIC_REGEX = /^(?:\d{9}[vVxX]|\d{12})$/;

export function validateTenantRegistration(formData) {
  const errors = {};

  const fullName = String(formData.name || '').trim();
  if (!fullName) {
    errors.name = 'Full name is required.';
  } else if (fullName.length < 2) {
    errors.name = 'Full name must be at least 2 characters.';
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

  const nationalId = String(formData.nic || '').trim();
  if (!nationalId) {
    errors.nic = 'NIC / National ID is required.';
  } else if (!NIC_REGEX.test(nationalId)) {
    errors.nic = 'Enter a valid NIC (9 digits + V/X or 12 digits).';
  }

  const buildingName = String(formData.buildingName || '').trim();
  if (!buildingName) {
    errors.buildingName = 'Building/Complex name is required.';
  } else if (buildingName.length < 2) {
    errors.buildingName = 'Enter a valid building name.';
  }

  const unitNumber = String(formData.unitNumber || '').trim();
  if (!unitNumber) {
    errors.unitNumber = 'Unit number is required.';
  } else if (unitNumber.length < 1) {
    errors.unitNumber = 'Enter a valid unit number.';
  }

  const floorNumber = String(formData.floorNumber || '').trim();
  if (!floorNumber) {
    errors.floorNumber = 'Floor number is required.';
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

  if (!formData.isResident) {
    errors.agreements = 'You must verify that you are a resident of this property.';
  }

  if (!formData.agreedToTerms) {
    errors.agreements = 'You must agree to the Terms of Service and Privacy Policy.';
  }

  if (!formData.agreedToMaintenance) {
    errors.agreements = 'You must consent to authorized maintenance staff access.';
  }

  return errors;
}
