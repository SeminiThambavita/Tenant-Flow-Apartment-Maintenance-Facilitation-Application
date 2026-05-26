# Postman Testing Guide for TenantFlow API

## 🚀 Prerequisites

1. **Start the Backend Server**
   ```bash
   cd tenantflow-backend
   npm run dev
   ```
   You should see: `Server running on port 5000`

2. **Install Postman**
   - Download from: https://www.postman.com/downloads/
   - Or use Postman Web at: https://web.postman.com/

3. **Set Base URL**
   ```
   http://localhost:5000
   ```

---

## 📋 Test Sequence

Follow this order to test all features:

1. ✅ Register a Tenant
2. ✅ Login as Tenant
3. ✅ Get Profile (with token)
4. ✅ Create Issue (with file upload)
5. ✅ Get All Issues
6. ✅ Get Single Issue
7. ✅ Update Profile
8. ✅ Change Password
9. ✅ Register Staff
10. ✅ Update Issue (staff/admin)

---

## 1️⃣ Register a Tenant

### Request Details
- **Method:** `POST`
- **URL:** `http://localhost:5000/auth/tenant-register`
- **Headers:** 
  ```
  Content-Type: application/json
  ```

### Body (raw JSON)
```json
{
  "name": "John Doe",
  "email": "john@test.com",
  "password": "password123",
  "phone": "0771234567",
  "apartmentNumber": "A-101",
  "floorNumber": "1",
  "nic": "199512345678",
  "profileImage": "default.jpg"
}
```

### Expected Response (201 Created)
```json
{
  "message": "Tenant registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1ZTM0..."
}
```

### ⚠️ What to Save
**Copy the `token` value** - you'll need it for all protected routes!

---

## 2️⃣ Login as Tenant

### Request Details
- **Method:** `POST`
- **URL:** `http://localhost:5000/auth/login`
- **Headers:** 
  ```
  Content-Type: application/json
  ```

### Body (raw JSON)
```json
{
  "email": "john@test.com",
  "password": "password123"
}
```

### Expected Response (200 OK)
```json
{
  "message": "Login successful",
  "role": "tenant",
  "status": "approved",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1ZTM0..."
}
```

### ⚠️ What to Save
**Copy the `token` value** - use this for authenticated requests.

---

## 🔒 Setting Up Authentication in Postman

For all protected routes, you need to add the Authorization header:

### Method 1: Manual Header
- **Header Key:** `Authorization`
- **Header Value:** `Bearer YOUR_TOKEN_HERE`

### Method 2: Authorization Tab (Recommended)
1. Click on **Authorization** tab
2. **Type:** Select `Bearer Token`
3. **Token:** Paste your token (without "Bearer")

![Postman Auth Example](https://i.imgur.com/example.png)

---

## 3️⃣ Get Profile (Protected)

### Request Details
- **Method:** `GET`
- **URL:** `http://localhost:5000/auth/profile`
- **Headers:** 
  ```
  Authorization: Bearer YOUR_TOKEN_HERE
  ```

### No Body Needed

### Expected Response (200 OK)
```json
{
  "user": {
    "_id": "65e345a7b8f9c2d1e4567890",
    "name": "John Doe",
    "email": "john@test.com",
    "role": "tenant",
    "phone": "0771234567",
    "apartmentNumber": "A-101",
    "floorNumber": "1",
    "nic": "199512345678",
    "profileImage": "default.jpg",
    "status": "approved",
    "createdAt": "2026-02-15T10:30:00.000Z",
    "updatedAt": "2026-02-15T10:30:00.000Z"
  }
}
```

### ❌ Common Errors
- **401 Unauthorized:** Token missing or invalid
- **404 User not found:** Token doesn't match any user

---

## 4️⃣ Create Issue (With File Upload)

### Request Details
- **Method:** `POST`
- **URL:** `http://localhost:5000/issues`
- **Headers:** 
  ```
  Authorization: Bearer YOUR_TOKEN_HERE
  ```
  ⚠️ **DO NOT** set `Content-Type` - Postman will auto-set it for form-data

### Body Type: `form-data`

| Key | Type | Value |
|-----|------|-------|
| issueType | Text | `plumbing` |
| building | Text | `Block A` |
| unitNumber | Text | `101` |
| specificSpot | Text | `Kitchen sink` |
| description | Text | `Water is leaking from the pipe under the sink` |
| media | File | *Select an image file* |
| media | File | *Select another image/video* (optional) |

### How to Add Files in Postman:
1. Select **Body** tab
2. Choose **form-data**
3. For file fields:
   - Key: `media`
   - Change type dropdown from "Text" to **"File"**
   - Click **Select Files** and choose an image/video
4. Add multiple files by using the same key `media` multiple times

### Expected Response (201 Created)
```json
{
  "message": "Issue reported successfully",
  "issue": {
    "_id": "65e345b8c9d0e1f2a3b4c5d6",
    "tenant": "65e345a7b8f9c2d1e4567890",
    "issueType": "plumbing",
    "building": "Block A",
    "unitNumber": "101",
    "specificSpot": "Kitchen sink",
    "description": "Water is leaking from the pipe under the sink",
    "media": [
      {
        "url": "/uploads/1708000000000-123456789.jpg",
        "type": "image",
        "filename": "leak-photo.jpg",
        "_id": "65e345b8c9d0e1f2a3b4c5d7"
      }
    ],
    "status": "pending",
    "priority": "medium",
    "createdAt": "2026-02-15T11:00:00.000Z",
    "updatedAt": "2026-02-15T11:00:00.000Z"
  }
}
```

### ⚠️ What to Save
**Copy the issue `_id`** - you'll use it to get/update this issue.

---

## 5️⃣ Get All Issues (Protected)

### Request Details
- **Method:** `GET`
- **URL:** `http://localhost:5000/issues`
- **Headers:** 
  ```
  Authorization: Bearer YOUR_TOKEN_HERE
  ```

### Optional Query Parameters
- **Filter by status:**
  - `http://localhost:5000/issues?status=pending`
  - `http://localhost:5000/issues?status=completed`
  - `http://localhost:5000/issues?status=in-progress`

### Expected Response (200 OK)
```json
{
  "count": 2,
  "issues": [
    {
      "_id": "65e345b8c9d0e1f2a3b4c5d6",
      "tenant": {
        "_id": "65e345a7b8f9c2d1e4567890",
        "name": "John Doe",
        "email": "john@test.com",
        "apartmentNumber": "A-101"
      },
      "issueType": "plumbing",
      "building": "Block A",
      "unitNumber": "101",
      "specificSpot": "Kitchen sink",
      "description": "Water is leaking",
      "media": [...],
      "status": "pending",
      "priority": "medium",
      "createdAt": "2026-02-15T11:00:00.000Z"
    }
  ]
}
```

---

## 6️⃣ Get Single Issue (Protected)

### Request Details
- **Method:** `GET`
- **URL:** `http://localhost:5000/issues/65e345b8c9d0e1f2a3b4c5d6`
  - Replace with your actual issue ID
- **Headers:** 
  ```
  Authorization: Bearer YOUR_TOKEN_HERE
  ```

### Expected Response (200 OK)
```json
{
  "issue": {
    "_id": "65e345b8c9d0e1f2a3b4c5d6",
    "tenant": {
      "_id": "65e345a7b8f9c2d1e4567890",
      "name": "John Doe",
      "email": "john@test.com",
      "phone": "0771234567",
      "apartmentNumber": "A-101",
      "floorNumber": "1"
    },
    "issueType": "plumbing",
    "building": "Block A",
    "unitNumber": "101",
    "specificSpot": "Kitchen sink",
    "description": "Water is leaking from the pipe under the sink",
    "media": [...],
    "status": "pending",
    "priority": "medium",
    "assignedTo": null,
    "createdAt": "2026-02-15T11:00:00.000Z"
  }
}
```

---

## 7️⃣ Update Profile (Protected)

### Request Details
- **Method:** `PUT`
- **URL:** `http://localhost:5000/auth/profile`
- **Headers:** 
  ```
  Authorization: Bearer YOUR_TOKEN_HERE
  Content-Type: application/json
  ```

### Body (raw JSON)
```json
{
  "name": "John Updated",
  "phone": "0779999999"
}
```

### Expected Response (200 OK)
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "65e345a7b8f9c2d1e4567890",
    "name": "John Updated",
    "email": "john@test.com",
    "phone": "0779999999",
    "role": "tenant"
  }
}
```

---

## 8️⃣ Change Password (Protected)

### Request Details
- **Method:** `PUT`
- **URL:** `http://localhost:5000/auth/password`
- **Headers:** 
  ```
  Authorization: Bearer YOUR_TOKEN_HERE
  Content-Type: application/json
  ```

### Body (raw JSON)
```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword456"
}
```

### Expected Response (200 OK)
```json
{
  "message": "Password changed successfully"
}
```

### ❌ Common Errors
- **400:** Current password is incorrect
- **400:** Missing fields

---

## 9️⃣ Register Staff

### Request Details
- **Method:** `POST`
- **URL:** `http://localhost:5000/auth/staff-register`
- **Headers:** 
  ```
  Content-Type: application/json
  ```

### Body (raw JSON)
```json
{
  "name": "Mike Plumber",
  "email": "mike@staff.com",
  "password": "staffpass123",
  "phone": "0777654321",
  "staffType": "plumber",
  "shift": "morning",
  "skills": "Pipe repair, installation, leak fixing"
}
```

### Expected Response (201 Created)
```json
{
  "message": "Staff registered. Waiting for admin approval."
}
```

### ⚠️ Note
Staff cannot login until admin approves them (status changes to "approved").

---

## 🔟 Update Issue Status (Staff/Admin)

### Request Details
- **Method:** `PUT`
- **URL:** `http://localhost:5000/issues/65e345b8c9d0e1f2a3b4c5d6`
  - Replace with your issue ID
- **Headers:** 
  ```
  Authorization: Bearer YOUR_TOKEN_HERE
  Content-Type: application/json
  ```

### Body (raw JSON)
```json
{
  "status": "in-progress",
  "priority": "high",
  "resolutionNotes": "Started working on the leak. Will fix by EOD."
}
```

### Expected Response (200 OK)
```json
{
  "message": "Issue updated successfully",
  "issue": {
    "_id": "65e345b8c9d0e1f2a3b4c5d6",
    "status": "in-progress",
    "priority": "high",
    "resolutionNotes": "Started working on the leak. Will fix by EOD.",
    "tenant": {...},
    "assignedTo": null
  }
}
```

---

## 🎯 Postman Collection Setup

### Create a Collection

1. **Create New Collection**
   - Name: `TenantFlow API`

2. **Add Collection Variables**
   - Click on collection → **Variables** tab
   - Add variables:
     | Variable | Initial Value | Current Value |
     |----------|--------------|---------------|
     | baseUrl  | http://localhost:5000 | http://localhost:5000 |
     | token    | | *Leave empty - will be set by tests* |
     | issueId  | | *Leave empty* |

3. **Use Variables in Requests**
   - URL: `{{baseUrl}}/auth/login`
   - Header: `Bearer {{token}}`

### Auto-Save Token After Login

In the **Login** request, add a **Test** script:

```javascript
// Parse response
let response = pm.response.json();

// Save token to collection variable
if (response.token) {
    pm.collectionVariables.set("token", response.token);
    console.log("Token saved:", response.token);
}
```

Now all subsequent requests can use `{{token}}` in Authorization!

---

## 🧪 Testing Scenarios

### Scenario 1: Complete User Journey
1. Register tenant → Get token
2. Login → Verify token works
3. Get profile → Check data
4. Create issue with 2 photos
5. Get all issues → Verify issue appears
6. Update profile
7. Change password
8. Login with new password

### Scenario 2: Error Handling
1. Login with wrong password → Expect 400
2. Access protected route without token → Expect 401
3. Register with existing email → Expect 400
4. Create issue without required fields → Expect 400
5. Upload non-image file → Expect error

### Scenario 3: File Upload
1. Create issue with 1 image
2. Create issue with 3 images
3. Create issue with 1 video
4. Create issue with mixed media (images + videos)
5. Verify uploaded files exist at `/uploads/filename.jpg`

---

## 🔍 Viewing Uploaded Files

After uploading files via POST `/issues`, you can view them in browser:

```
http://localhost:5000/uploads/{filename}
```

Example:
```
http://localhost:5000/uploads/1708000000000-123456789.jpg
```

The filename is returned in the `media` array of the issue response.

---

## ❌ Common Errors & Solutions

### 1. Network Error / Cannot connect
**Problem:** Backend server not running  
**Solution:** 
```bash
cd tenantflow-backend
npm run dev
```

### 2. 401 Unauthorized
**Problem:** Missing or invalid token  
**Solution:** 
- Copy token from login/register response
- Add to Authorization header: `Bearer YOUR_TOKEN`

### 3. 400 Bad Request - "All tenant fields are required"
**Problem:** Missing required fields in registration  
**Solution:** Include all fields shown in the example

### 4. 400 - "Email already exists"
**Problem:** User already registered with this email  
**Solution:** Use a different email or login instead

### 5. File upload fails
**Problem:** Content-Type header set incorrectly  
**Solution:** 
- Use `form-data` body type
- Remove `Content-Type` header (Postman auto-sets it)
- Ensure files are selected as type "File" not "Text"

### 6. 500 Server Error
**Problem:** Database connection issue  
**Solution:** 
- Check MongoDB connection in `.env`
- Check backend console for error logs

---

## 📊 Response Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | GET requests |
| 201 | Created | POST registration, create issue |
| 400 | Bad Request | Validation errors, missing fields |
| 401 | Unauthorized | Invalid/missing token |
| 403 | Forbidden | Staff not approved |
| 404 | Not Found | Issue/user doesn't exist |
| 500 | Server Error | Database or server issue |

---

## 💡 Pro Tips

1. **Save Requests in Collection**
   - Organize by folder: Auth, Issues, Profile
   - Reuse requests with different data

2. **Use Environment Variables**
   - Switch between dev/prod easily
   - Share collection without exposing tokens

3. **Add Tests**
   - Verify status code: `pm.response.to.have.status(200)`
   - Validate response structure
   - Auto-save important values

4. **Use Pre-request Scripts**
   - Generate random emails for testing
   - Auto-timestamp descriptions

5. **Export Collection**
   - Share with team members
   - Version control your API tests

---

## 📥 Sample Postman Collection JSON

Save this as `TenantFlow.postman_collection.json`:

```json
{
  "info": {
    "name": "TenantFlow API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000"
    },
    {
      "key": "token",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Tenant Register",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/auth/tenant-register",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"John Doe\",\n  \"email\": \"john@test.com\",\n  \"password\": \"password123\",\n  \"phone\": \"0771234567\",\n  \"apartmentNumber\": \"A-101\",\n  \"floorNumber\": \"1\",\n  \"nic\": \"199512345678\",\n  \"profileImage\": \"default.jpg\"\n}"
            }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/auth/login",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"john@test.com\",\n  \"password\": \"password123\"\n}"
            }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "let response = pm.response.json();",
                  "if (response.token) {",
                  "    pm.collectionVariables.set('token', response.token);",
                  "}"
                ]
              }
            }
          ]
        }
      ]
    }
  ]
}
```

Import this file into Postman: **Import → Upload Files**

---

## ✅ Testing Checklist

- [ ] Backend server running on port 5000
- [ ] Can register new tenant
- [ ] Can login and receive token
- [ ] Token works for protected routes
- [ ] Can get user profile
- [ ] Can create issue without files
- [ ] Can create issue with 1 image
- [ ] Can create issue with multiple files
- [ ] Can get all issues
- [ ] Can filter issues by status
- [ ] Can get single issue by ID
- [ ] Can update profile
- [ ] Can change password
- [ ] Old password stops working after change
- [ ] Can register staff member
- [ ] Error messages are clear
- [ ] Invalid token returns 401
- [ ] Missing fields return 400

---

**Happy Testing! 🚀**

Need help? Check the backend console logs for detailed error messages.
