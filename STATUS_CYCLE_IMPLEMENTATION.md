# Status Cycle Implementation - Complete Guide

## Overview
This document outlines the complete implementation of the issue/task status cycle for TenantFlow. The system now tracks issues from initial reporting through task completion, with full notification support for all three parties (tenant, staff, property manager).

## Status Cycle Flow

```
NEW (Tenant reports issue)
  ↓
ASSIGNED (Admin assigns to staff - Auto-status change)
  ↓
IN PROGRESS (Staff starts working)
  ↓
COMPLETED (Staff finishes - Triggers cost report prompt)
  ↓
[Future: Payment stages]
```

## Key Features Implemented

### 1. **Notification System**
- **Model**: `Notification.js` - Stores all notifications in the database
- **Service**: `notificationService.js` - Handles creation and management of notifications
- **Features**:
  - Issue reported notifications
  - Task assignment notifications
  - Status change notifications
  - Cost report required notifications
  - Unread notification tracking
  - Mark as read functionality

### 2. **Backend Status Management**

#### Updated Issue Model
- `propertyManager`: Reference to the property manager handling the issue
- `statusHistory`: Audit trail of all status changes
- `costReportRequired`: Flag to indicate if cost report is needed
- `costReportCreatedAt`: Timestamp when cost report is created

#### Status Transitions
**Admin (Property Manager) Actions:**
- Can assign unassigned tasks (new → assigned)
- Can unassign tasks (assigned/in progress → new)
- Can manually change any status
- Can bulk assign multiple tasks

**Staff Member Actions:**
- assigned → in progress (Start work)
- in progress → completed (Mark as done)
- Can only change statuses for their assigned tasks
- Cannot skip statuses (must follow the workflow)

#### Auto-Status Changes
- When admin assigns a task to staff: status automatically changes from "new" to "assigned"
- Prevents manual "assigned" status update from affecting workflow

### 3. **Backend Notification Flow**

**When Issue is Reported (New Status):**
1. Tenant creates issue
2. Admin (property manager) is notified
3. Notification displayed in admin dashboard

**When Task is Assigned:**
1. Admin selects staff and assigns task
2. Status auto-changes to "assigned"
3. Notifications sent to:
   - **Staff member**: "Task Assigned to You" notification with task details and link to view
   - **Tenant**: "Staff Member Assigned" notification with staff name and details
   - **Property Manager**: Confirmation of assignment

**When Status Changes (In Progress):**
1. Staff marks task as "in progress"
2. Notifications sent to:
   - **Staff**: Confirmation that work has started
   - **Tenant**: "Work Started" notification with staff name
   - **Property Manager**: Status update for monitoring

**When Task is Completed:**
1. Staff marks task as "completed"
2. Cost report modal displays automatically
3. Notifications sent to:
   - **Staff**: "Cost Report Required" notification with prompt to create report
   - **Tenant**: "Task Completed" notification with staff name
   - **Property Manager**: Task completion notification

### 4. **Frontend Components**

#### New Components
- **NotificationBell.jsx**: Dropdown notification display with:
  - Unread notification count
  - List of recent notifications
  - Mark as read functionality
  - Delete notification functionality
  - Color-coded by notification type
  - Time formatting (just now, minutes ago, hours ago, etc.)

- **CostReportModal.jsx**: Modal for staff to submit cost report with:
  - Work description field
  - Labor cost breakdown
  - Materials cost breakdown
  - Other costs breakdown
  - Total cost calculation
  - Additional notes field
  - Form validation

#### Updated Components
- **StaffNav.jsx**: Added NotificationBell to navigation
- **AdminSidebar.jsx**: Added NotificationBell to sidebar
- **StaffTaskDetail.jsx**: 
  - Integrated CostReportModal
  - Shows modal when task marked as completed
  - Handles cost report submission

#### New Hook
- **useNotifications.js**: Custom hook providing:
  - Fetch notifications
  - Get unread count
  - Mark as read
  - Mark all as read
  - Delete notification
  - Clear all notifications
  - Auto-refresh every 30 seconds

### 5. **API Endpoints**

#### Notification Endpoints
```
GET    /notifications              - Get all notifications for user
GET    /notifications/unread/count - Get unread notification count
PUT    /notifications/:id/read     - Mark single notification as read
PUT    /notifications/read-all     - Mark all notifications as read
DELETE /notifications/:id          - Delete single notification
DELETE /notifications/clear-all    - Clear all notifications
```

#### Issue Endpoints (Updated)
```
POST   /issues                     - Create new issue (triggers admin notification)
GET    /issues                     - Get issues (includes status history)
GET    /issues/:id                 - Get issue details
PUT    /issues/:id                 - Update issue status (triggers notifications)
DELETE /issues/:id                 - Delete issue
```

### 6. **Database Collections**

#### Issues Collection (Enhanced)
```javascript
{
  _id: ObjectId,
  tenant: ObjectId,              // Reference to tenant
  propertyManager: ObjectId,     // Reference to property manager
  assignedTo: ObjectId,          // Reference to assigned staff
  issueType: String,             // plumbing, electrical, etc.
  status: String,                // new, assigned, in progress, completed
  priority: String,              // low, medium, high
  building: String,
  unitNumber: String,
  specificSpot: String,
  description: String,
  media: [{url, type, filename}],
  statusHistory: [{              // NEW: Audit trail
    status: String,
    changedBy: ObjectId,
    changedAt: Date,
    reason: String
  }],
  costReportRequired: Boolean,   // NEW: Cost report flag
  costReportCreatedAt: Date,     // NEW: When cost report was created
  resolvedAt: Date,
  resolutionNotes: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Notifications Collection
```javascript
{
  _id: ObjectId,
  recipient: ObjectId,           // User who receives notification
  type: String,                  // issue_reported, task_assigned, task_status_changed
  issue: ObjectId,               // Related issue
  title: String,
  message: String,
  data: {                        // Additional context
    previousStatus: String,
    newStatus: String,
    issueType: String,
    unitNumber: String,
    building: String,
    tenantName: String,
    assignedStaffName: String
  },
  isRead: Boolean,
  actionUrl: String,             // Link to relevant page
  createdAt: Date,
  updatedAt: Date
}
```

## Workflow Examples

### Example 1: Complete Issue Reporting Flow

```
1. Tenant reports plumbing issue
   → Issue created with status "new"
   → Admin receives notification: "New Issue Reported"

2. Admin views unassigned tasks
   → Sees new issue in task assignment page
   → Selects staff member (e.g., plumber)
   → Clicks "Assign" button

3. Assignment happens:
   → Issue status auto-changes from "new" to "assigned"
   → Staff receives notification: "Task Assigned to You"
   → Tenant receives notification: "Staff Member Assigned"
   → Admin receives confirmation: "Task Assigned"

4. Staff starts work:
   → Staff clicks "Start Work (In Progress)"
   → Status changes to "in progress"
   → All parties notified of work start

5. Staff completes work:
   → Staff clicks "Mark as Completed"
   → Status changes to "completed"
   → CostReportModal displays automatically
   → Staff fills cost report and submits
   → All parties notified of completion

6. Future: Tenant reviews and pays
   → [To be implemented in payment phase]
```

## Implementation Checklist

### Backend
- [x] Create Notification model
- [x] Create notification service with all helper functions
- [x] Create notification controller with CRUD endpoints
- [x] Create notification routes
- [x] Update Issue model with new fields
- [x] Update issue controller with notification integration
- [x] Auto-status change logic on assignment
- [x] Status transition validation
- [x] Register notification routes in server.js
- [x] Database migration for existing issues (statusHistory)

### Frontend
- [x] Create useNotifications hook
- [x] Create NotificationBell component
- [x] Create CostReportModal component
- [x] Update StaffNav with NotificationBell
- [x] Update AdminSidebar with NotificationBell
- [x] Update StaffTaskDetail with cost report modal
- [x] Update API client with notification endpoints
- [x] Add notification API to api.js

## Testing Guide

### Manual Testing Steps

#### Step 1: Test Issue Reporting
```
1. Login as tenant
2. Report a new issue
3. Go to admin dashboard
4. Verify admin receives notification for new issue
5. Check notification shows correct issue type and location
```

#### Step 2: Test Task Assignment
```
1. Login as admin
2. Go to task assignment page
3. Select an unassigned task
4. Select a staff member
5. Click assign
6. Verify:
   - Task status changed to "assigned"
   - Staff member receives notification
   - Tenant receives notification
   - Admin sees confirmation
```

#### Step 3: Test Status Transitions
```
1. Login as staff member
2. Go to task details
3. Click "Start Work (In Progress)"
4. Verify status changes and notifications sent
5. After work complete, click "Mark as Completed"
6. Verify CostReportModal displays
```

#### Step 4: Test Notifications
```
1. Login as any role
2. Look for notification bell in top navigation
3. Click to see notifications
4. Test mark as read
5. Test delete notification
6. Verify unread count updates
7. Test clearing all notifications
```

## Future Enhancements

### Phase 2: Cost Reports
- Create Invoice/CostReport model
- Implement cost report storage
- Add cost report history/audit trail
- Create cost report review workflow

### Phase 3: Payments
- Implement payment processing
- Add payment status notifications
- Create payment history
- Add payment reminders

### Phase 4: Advanced Features
- Real-time notifications (WebSocket)
- Notification preferences/settings
- Notification scheduling
- Bulk operations
- Advanced filtering and search
- SLA tracking and alerts

## Troubleshooting

### Notifications Not Showing
1. Check browser console for errors
2. Verify user is authenticated
3. Check notification bell component is imported in nav
4. Clear browser cache and reload

### Cost Report Modal Not Displaying
1. Verify issue status is "completed"
2. Check costReportRequired flag in response
3. Verify CostReportModal component is imported
4. Check browser console for component errors

### Status Transitions Blocked
1. Verify user role has permission for transition
2. Check current status is valid for transition
3. Verify assigned staff ID matches logged-in user ID
4. Check for API errors in network tab

## File Locations Summary

```
Backend:
- Models: /models/Notification.js, /models/Issue.js (updated)
- Services: /services/notificationService.js
- Controllers: /controllers/notificationController.js, /controllers/issueController.js (updated)
- Routes: /routes/notificationRoutes.js

Frontend:
- Hooks: /src/hooks/useNotifications.js
- Components: 
  - /src/components/NotificationBell.jsx
  - /src/components/CostReportModal.jsx
  - /src/components/StaffNav.jsx (updated)
  - /src/components/AdminSidebar.jsx (updated)
- Pages:
  - /src/pages/StaffTaskDetail.jsx (updated)
- API: /src/api.js (updated)
```

## Support & Questions

For implementation questions or issues:
1. Check the troubleshooting section above
2. Review the workflow examples
3. Check component imports and dependencies
4. Verify all new files are created
5. Test API endpoints using Postman
