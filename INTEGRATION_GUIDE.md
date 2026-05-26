# Frontend-Backend Integration Guide

## Overview
This guide shows how to integrate your existing frontend pages with the newly implemented backend API.

---

## 🚀 Quick Start

### 1. Start Backend Server
```bash
cd tenantflow-backend
npm install  # if not already done
npm run dev
```
Server will run on: `http://localhost:5000`

### 2. Verify Frontend API URL
Check `tenantflow_frontend/.env`:
```
VITE_API_URL=http://localhost:5000
```

### 3. Start Frontend
```bash
cd tenantflow_frontend
npm run dev
```

---

## 📝 Page-by-Page Integration

### 1. Login Page (`src/pages/Login.jsx`)

**Current:** Mock login  
**Update to:**

```javascript
import { authAPI } from '../api';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(email, password);
      const { token, role } = response.data;

      // Store authentication data
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', role);

      // Navigate based on role
      if (role === 'tenant') {
        navigate('/tenant-dashboard');
      } else if (role === 'staff') {
        navigate('/staff-dashboard');
      } else if (role === 'admin') {
        navigate('/admin-dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    // ... existing JSX with form
    // Add error display: {error && <p className="text-red-500">{error}</p>}
    // Add loading state to button: disabled={loading}
  );
};
```

---

### 2. Register Page (`src/pages/Register.jsx`)

**Update the handleSubmit function:**

```javascript
import { authAPI } from '../api';

const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validate passwords match
  if (password !== confirmPassword) {
    setError('Passwords do not match');
    return;
  }

  // Validate terms accepted
  if (!agreedToTerms) {
    setError('You must agree to the terms and conditions');
    return;
  }

  setLoading(true);
  setError('');

  try {
    const registrationData = {
      name: fullName,
      email,
      password,
      phone: phoneNumber,
      apartmentNumber: unitNumber,
      floorNumber,
      nic,
      profileImage: profilePicture || 'default.jpg', // handle file upload separately
      // Emergency contacts can be stored in a separate collection later
    };

    const response = await authAPI.tenantRegister(registrationData);
    const { token } = response.data;

    // Store token and navigate
    localStorage.setItem('token', token);
    localStorage.setItem('userRole', 'tenant');
    
    navigate('/tenant-dashboard');
  } catch (err) {
    setError(err.response?.data?.message || 'Registration failed');
  } finally {
    setLoading(false);
  }
};
```

---

### 3. Tenant Dashboard (`src/pages/TenantDashboard.jsx`)

**Replace mock data with API calls:**

```javascript
import { issueAPI } from '../api';
import { useEffect, useState } from 'react';

const TenantDashboard = () => {
  const [issues, setIssues] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  // Fetch issues on mount and when filter changes
  useEffect(() => {
    fetchIssues();
  }, [filterStatus]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const response = await issueAPI.getAll({ 
        params: { status: filterStatus === 'all' ? undefined : filterStatus }
      });
      setIssues(response.data.issues);
    } catch (error) {
      console.error('Failed to fetch issues:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats from real data
  const pendingCount = issues.filter(i => i.status === 'pending').length;
  const completedThisMonth = issues.filter(i => {
    if (i.status !== 'completed') return false;
    const completedDate = new Date(i.resolvedAt);
    const now = new Date();
    return completedDate.getMonth() === now.getMonth() && 
           completedDate.getFullYear() === now.getFullYear();
  }).length;

  const filteredRequests = filterStatus === 'all' 
    ? issues 
    : issues.filter(issue => issue.status === filterStatus);

  // ... rest of component
};
```

---

### 4. Report Issue Page (`src/pages/ReportIssue.jsx`)

**Update handleNext to prepare for API submission:**

```javascript
const handleNext = () => {
  if (!validateForm()) return;

  // Save to localStorage for persistence
  const reportData = {
    issueType: selectedType,
    building,
    unitNumber,
    specificSpot,
    description,
    // Don't store files in localStorage - pass them via state
  };
  localStorage.setItem('tenantflow_report_issue', JSON.stringify(reportData));

  // Navigate to review with files
  navigate('/report-issue/review', {
    state: {
      ...reportData,
      mediaFiles // Pass actual File objects
    }
  });
};
```

---

### 5. Review Issue Page (`src/pages/ReviewIssue.jsx`)

**Update handleSubmit to call API:**

```javascript
import { issueAPI } from '../api';

const ReviewIssue = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reportData = location.state || JSON.parse(
    localStorage.getItem('tenantflow_report_issue') || '{}'
  );

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('issueType', reportData.issueType);
      formData.append('building', reportData.building);
      formData.append('unitNumber', reportData.unitNumber);
      formData.append('specificSpot', reportData.specificSpot);
      formData.append('description', reportData.description);

      // Append media files
      if (reportData.mediaFiles && reportData.mediaFiles.length > 0) {
        reportData.mediaFiles.forEach(file => {
          formData.append('media', file);
        });
      }

      // Submit to backend
      await issueAPI.create(formData);

      // Clear localStorage
      localStorage.removeItem('tenantflow_report_issue');

      // Show success modal
      setShowSuccess(true);

      // Auto-navigate after 2 seconds
      setTimeout(() => {
        navigate('/tenant-dashboard');
      }, 2000);

    } catch (error) {
      console.error('Failed to submit issue:', error);
      alert('Failed to submit issue. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // ... existing JSX
    // Update submit button: disabled={submitting}
  );
};
```

---

### 6. Profile Page (`src/pages/Profile.jsx`)

**Add API calls for profile updates:**

```javascript
import { authAPI } from '../api';
import { useEffect } from 'react';

const Profile = () => {
  // ... existing state

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      const user = response.data.user;
      
      setProfileForm({
        name: user.name,
        email: user.email,
        phone: user.phone,
        residence: `${user.apartmentNumber}, Floor ${user.floorNumber}`,
        nic: user.nic
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await authAPI.updateProfile({
        name: profileForm.name,
        phone: profileForm.phone
      });
      
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    // Validate passwords match
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    try {
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      alert('Password changed successfully!');
      
      // Clear form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Failed to change password:', error);
      alert(error.response?.data?.message || 'Failed to change password');
    }
  };

  // ... rest of component
};
```

---

## 🔒 Protected Routes

Add route protection in `App.jsx`:

```javascript
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// In your routes:
<Route 
  path="/tenant-dashboard" 
  element={
    <ProtectedRoute allowedRoles={['tenant']}>
      <TenantDashboard />
    </ProtectedRoute>
  } 
/>
```

---

## 🖼️ Displaying Uploaded Media

To display media from the backend:

```javascript
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// In your component:
{issue.media.map((file, index) => (
  <div key={index}>
    {file.type === 'image' ? (
      <img 
        src={`${BASE_URL}${file.url}`} 
        alt={file.filename}
        className="w-full h-48 object-cover rounded"
      />
    ) : (
      <video 
        src={`${BASE_URL}${file.url}`} 
        controls
        className="w-full h-48 rounded"
      />
    )}
  </div>
))}
```

---

## 🧪 Testing Checklist

- [ ] Backend server running on port 5000
- [ ] MongoDB connected successfully
- [ ] Frontend can register new tenant
- [ ] Login redirects to dashboard based on role
- [ ] Dashboard displays real issues from database
- [ ] Report issue form submits with media files
- [ ] Issue appears in dashboard after submission
- [ ] Profile page loads user data
- [ ] Profile updates save correctly
- [ ] Password change works with validation
- [ ] Filter by status works (pending/completed)
- [ ] Logout clears token and redirects to login

---

## 🐛 Common Issues & Solutions

### Issue: "Network Error" when calling API
**Solution:** Check if backend server is running on port 5000

### Issue: "401 Unauthorized"
**Solution:** Token might be expired or invalid. Clear localStorage and login again.

### Issue: "CORS Error"
**Solution:** Backend already has CORS enabled. Check browser console for details.

### Issue: File upload fails
**Solution:** Check file size (max 50MB) and format (images/videos only)

### Issue: Images don't display
**Solution:** Ensure backend serves static files from `/uploads` (already configured in server.js)

---

## 📊 Data Flow Example

```
1. User clicks "Report Issue"
   ↓
2. Fills form in ReportIssue.jsx
   ↓
3. Data saved to localStorage (for persistence)
   ↓
4. Navigate to ReviewIssue.jsx
   ↓
5. User confirms and clicks Submit
   ↓
6. FormData created with files
   ↓
7. POST /issues with multipart/form-data
   ↓
8. Backend saves to MongoDB
   ↓
9. Files stored in uploads/ folder
   ↓
10. Success response
   ↓
11. localStorage cleared
   ↓
12. Navigate to dashboard
   ↓
13. Dashboard fetches updated issues
```

---

## 🔐 Security Notes

- Tokens stored in localStorage (consider httpOnly cookies for production)
- Passwords hashed with bcrypt before storage
- JWT tokens expire in 30 days
- File uploads limited to 50MB per file
- Only authenticated users can access protected routes

---

## Next Steps

1. Test all flows with real backend
2. Add error handling UI components
3. Add loading states to all async operations
4. Implement logout functionality
5. Add admin dashboard for managing issues
6. Add staff dashboard for viewing assigned tasks
