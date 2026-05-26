# TenantFlow API Documentation

## Base URL
```
http://localhost:5000
```

## Authentication
All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### 1. Tenant Registration
**POST** `/auth/tenant-register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "0771234567",
  "apartmentNumber": "A-101",
  "floorNumber": "1",
  "nic": "199512345678",
  "profileImage": "base64_or_url"
}
```

**Response:**
```json
{
  "message": "Tenant registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 2. Staff Registration
**POST** `/auth/staff-register`

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "password123",
  "phone": "0777654321",
  "staffType": "plumber",
  "shift": "morning",
  "skills": "Pipe repair, installation"
}
```

**Response:**
```json
{
  "message": "Staff registered. Waiting for admin approval."
}
```

---

### 3. Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "role": "tenant",
  "status": "approved",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 4. Get Profile
**GET** `/auth/profile`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "user": {
    "_id": "60d5ec49f1b2c72b8c8e4a1a",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "0771234567",
    "role": "tenant",
    "apartmentNumber": "A-101",
    "floorNumber": "1",
    "nic": "199512345678"
  }
}
```

---

### 5. Update Profile
**PUT** `/auth/profile`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Updated",
  "phone": "0779999999"
}
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "60d5ec49f1b2c72b8c8e4a1a",
    "name": "John Updated",
    "email": "john@example.com",
    "phone": "0779999999",
    "role": "tenant"
  }
}
```

---

### 6. Change Password
**PUT** `/auth/password`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**Response:**
```json
{
  "message": "Password changed successfully"
}
```

---

## Issue Endpoints

### 1. Create Issue (with file upload)
**POST** `/issues`

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Form Data:**
```
issueType: "plumbing"
building: "Block A"
unitNumber: "101"
specificSpot: "Kitchen sink"
description: "Leaking pipe under the sink"
media: [File, File, ...] // up to 10 files
```

**Response:**
```json
{
  "message": "Issue reported successfully",
  "issue": {
    "_id": "60d5ec49f1b2c72b8c8e4a1b",
    "tenant": "60d5ec49f1b2c72b8c8e4a1a",
    "issueType": "plumbing",
    "building": "Block A",
    "unitNumber": "101",
    "specificSpot": "Kitchen sink",
    "description": "Leaking pipe under the sink",
    "media": [
      {
        "url": "/uploads/1625234567890-123456789.jpg",
        "type": "image",
        "filename": "leak-photo.jpg"
      }
    ],
    "status": "pending",
    "priority": "medium",
    "createdAt": "2026-02-15T10:30:00.000Z"
  }
}
```

---

### 2. Get All Issues
**GET** `/issues?status=pending`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status` (optional): `all`, `pending`, `in-progress`, `completed`

**Response:**
```json
{
  "count": 5,
  "issues": [
    {
      "_id": "60d5ec49f1b2c72b8c8e4a1b",
      "tenant": {
        "_id": "60d5ec49f1b2c72b8c8e4a1a",
        "name": "John Doe",
        "email": "john@example.com",
        "apartmentNumber": "A-101"
      },
      "issueType": "plumbing",
      "building": "Block A",
      "unitNumber": "101",
      "specificSpot": "Kitchen sink",
      "description": "Leaking pipe",
      "status": "pending",
      "priority": "medium",
      "createdAt": "2026-02-15T10:30:00.000Z"
    }
  ]
}
```

---

### 3. Get Issue by ID
**GET** `/issues/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "issue": {
    "_id": "60d5ec49f1b2c72b8c8e4a1b",
    "tenant": {
      "_id": "60d5ec49f1b2c72b8c8e4a1a",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "0771234567",
      "apartmentNumber": "A-101",
      "floorNumber": "1"
    },
    "issueType": "plumbing",
    "building": "Block A",
    "unitNumber": "101",
    "specificSpot": "Kitchen sink",
    "description": "Leaking pipe under the sink",
    "media": [],
    "status": "pending",
    "priority": "medium",
    "assignedTo": null,
    "createdAt": "2026-02-15T10:30:00.000Z"
  }
}
```

---

### 4. Update Issue (Staff/Admin)
**PUT** `/issues/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "in-progress",
  "priority": "high",
  "assignedTo": "60d5ec49f1b2c72b8c8e4a1c",
  "resolutionNotes": "Started fixing the leak"
}
```

**Response:**
```json
{
  "message": "Issue updated successfully",
  "issue": {
    "_id": "60d5ec49f1b2c72b8c8e4a1b",
    "status": "in-progress",
    "priority": "high",
    "assignedTo": {
      "_id": "60d5ec49f1b2c72b8c8e4a1c",
      "name": "Mike Plumber",
      "staffType": "plumber"
    }
  }
}
```

---

### 5. Delete Issue (Admin)
**DELETE** `/issues/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Issue deleted successfully"
}
```

---

## Frontend Integration Example

### Login Flow
```javascript
import { authAPI } from './api';

const handleLogin = async (email, password) => {
  try {
    const response = await authAPI.login(email, password);
    const { token, role } = response.data;
    
    // Store token
    localStorage.setItem('token', token);
    localStorage.setItem('userRole', role);
    
    // Navigate based on role
    if (role === 'tenant') {
      navigate('/tenant-dashboard');
    } else if (role === 'staff') {
      navigate('/staff-dashboard');
    }
  } catch (error) {
    console.error('Login failed:', error.response.data.message);
  }
};
```

---

### Report Issue with Media Upload
```javascript
import { issueAPI } from './api';

const handleSubmitIssue = async (formData, mediaFiles) => {
  try {
    // Create FormData for file upload
    const data = new FormData();
    data.append('issueType', formData.issueType);
    data.append('building', formData.building);
    data.append('unitNumber', formData.unitNumber);
    data.append('specificSpot', formData.specificSpot);
    data.append('description', formData.description);
    
    // Append media files
    mediaFiles.forEach(file => {
      data.append('media', file);
    });
    
    const response = await issueAPI.create(data);
    console.log('Issue created:', response.data);
    
    // Clear localStorage and navigate
    localStorage.removeItem('tenantflow_report_issue');
    navigate('/tenant-dashboard');
  } catch (error) {
    console.error('Failed to submit issue:', error.response.data.message);
  }
};
```

---

### Fetch User's Issues
```javascript
import { issueAPI } from './api';

const fetchIssues = async (status = 'all') => {
  try {
    const response = await issueAPI.getAll({ params: { status } });
    const { issues, count } = response.data;
    
    setIssues(issues);
    console.log(`Found ${count} issues`);
  } catch (error) {
    console.error('Failed to fetch issues:', error.response.data.message);
  }
};
```

---

### Update Profile
```javascript
import { authAPI } from './api';

const handleUpdateProfile = async (profileData) => {
  try {
    const response = await authAPI.updateProfile({
      name: profileData.name,
      phone: profileData.phone
    });
    
    console.log('Profile updated:', response.data.message);
  } catch (error) {
    console.error('Update failed:', error.response.data.message);
  }
};
```

---

### Change Password
```javascript
import { authAPI } from './api';

const handleChangePassword = async (currentPassword, newPassword) => {
  try {
    const response = await authAPI.changePassword({
      currentPassword,
      newPassword
    });
    
    console.log('Password changed:', response.data.message);
  } catch (error) {
    console.error('Password change failed:', error.response.data.message);
  }
};
```

---

## Environment Variables (.env)

Create a `.env` file in the backend root:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/tenantflow
JWT_SECRET=tenantflow_secret_key_2026
```

---

## Testing the API

### Start the backend:
```bash
cd tenantflow-backend
npm install
npm run dev
```

### Test with curl:
```bash
# Register a tenant
curl -X POST http://localhost:5000/auth/tenant-register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "phone": "0771234567",
    "apartmentNumber": "A-101",
    "floorNumber": "1",
    "nic": "199512345678",
    "profileImage": "default.jpg"
  }'

# Login
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## Database Schema

### User Collection
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: "tenant" | "staff" | "admin",
  phone: String (required),
  
  // Tenant fields
  apartmentNumber: String,
  floorNumber: String,
  nic: String,
  profileImage: String,
  
  // Staff fields
  staffType: "plumber" | "electrician" | "cleaner" | "carpenter" | "other",
  shift: String,
  skills: String,
  status: "pending" | "approved" | "rejected",
  
  timestamps: true
}
```

### Issue Collection
```javascript
{
  tenant: ObjectId (ref: User),
  issueType: "plumbing" | "electrical" | "cleaning" | "carpentry" | "other",
  building: String (required),
  unitNumber: String (required),
  specificSpot: String (required),
  description: String (max 500 chars),
  media: [{
    url: String,
    type: "image" | "video",
    filename: String
  }],
  status: "pending" | "in-progress" | "completed",
  priority: "low" | "medium" | "high",
  assignedTo: ObjectId (ref: User),
  resolvedAt: Date,
  resolutionNotes: String,
  timestamps: true
}
```

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error
