# Quick Start Testing Guide

## Prerequisites
- Both backend and frontend servers running
- MongoDB database connected
- At least 3 user accounts:
  - 1 Admin (Property Manager)
  - 1 Staff member (with specific skill like "plumbing")
  - 1 Tenant (with building and unit assigned)

## Quick Test: Complete Issue Reporting Cycle (10-15 minutes)

### Step 1: Admin/Property Manager Login
1. Open the app and login as admin/property manager
2. Navigate to Dashboard
3. **Verify**: You should see notification bell in top navigation

### Step 2: Tenant Reports Issue
1. In a new tab/window, login as tenant
2. Go to "Report Issue" page
3. Fill in the form:
   - Issue Type: "Plumbing"
   - Specific Spot: "Kitchen Sink"
   - Description: "Water leak under sink"
   - (Optional: Upload a photo)
4. Click "Submit"
5. **Verify**: Issue submits successfully
6. Go back to admin tab and check notification bell
7. **Verify**: Admin has a new notification "New Issue Reported"

### Step 3: Admin Assigns Task
1. On admin dashboard, go to "Assign Unassigned Tasks" (or Task Assignment page)
2. **Verify**: You see the newly created issue
3. Select the issue by clicking the checkbox
4. Select a staff member from the dropdown (plumber if available)
5. Click "Assign" button
6. **Verify**: Success message appears
7. Check notification bell again
8. **Verify**: New notifications for task assignment

### Step 4: Check Staff Notifications
1. In a new tab, login as the staff member
2. Check notification bell
3. **Verify**: "Task Assigned to You" notification appears
4. Click on task to view details
5. **Verify**: Task shows with status "assigned"

### Step 5: Staff Starts Work
1. On staff task detail page, click "Start Work (In Progress)"
2. **Verify**: Status changes to "in progress"
3. Check notification bell
4. **Verify**: New status update notifications

### Step 6: Staff Completes Work
1. On staff task detail page, click "Mark as Completed"
2. **Verify**: Status changes to "completed"
3. **Verify**: CostReportModal pops up automatically
4. Fill in the cost report:
   - Work Description: "Replaced pipe under sink"
   - Labor Cost: "2000"
   - Materials Cost: "1500"
   - Other Cost: "0"
   - Notes: "Work completed successfully"
5. Click "Submit Cost Report"
6. **Verify**: Modal closes
7. **Verify**: Success message appears
8. Check notification bell
9. **Verify**: All parties received completion notification

### Step 7: Verify Complete Audit Trail
1. On admin dashboard, go to task details
2. Scroll to see status history (if available)
3. **Verify**: Shows:
   - new (reported)
   - assigned (when staff was assigned)
   - in progress (when staff started)
   - completed (when staff finished)
4. Each status change should show timestamp and who made the change

## Notification Bell Testing

### Basic Notification Functions
1. Click notification bell
2. **Verify**: Dropdown opens
3. **Verify**: Shows list of notifications
4. **Verify**: Shows unread count in red badge
5. Click "✓" on a notification to mark as read
6. **Verify**: Notification background changes (blue highlight removed)
7. Click "✕" on a notification to delete it
8. **Verify**: Notification removed from list
9. Click "Clear All" button
10. **Verify**: All notifications deleted

### Notification Content
1. Check each notification has:
   - Icon (📋 for issue, ✓ for assignment, ⚙️ for status change)
   - Title (clear action description)
   - Message (readable and informative)
   - Issue details (type, unit, building when relevant)
   - Time ago (just now, 5m ago, etc.)

## API Endpoint Testing (with Postman)

### Test Notification Endpoints
```
GET /notifications?limit=20&skip=0
- Headers: Authorization: Bearer <token>
- Response: List of notifications

GET /notifications/unread/count
- Headers: Authorization: Bearer <token>
- Response: { unreadCount: number }

PUT /notifications/:id/read
- Headers: Authorization: Bearer <token>
- Response: { message: "Notification marked as read" }

PUT /notifications/read-all
- Headers: Authorization: Bearer <token>
- Response: { message: "All notifications marked as read" }

DELETE /notifications/:id
- Headers: Authorization: Bearer <token>
- Response: { message: "Notification deleted successfully" }

DELETE /notifications/clear-all
- Headers: Authorization: Bearer <token>
- Response: { message: "All notifications cleared" }
```

### Test Issue Status Update
```
PUT /issues/:id
Headers: Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "status": "in progress"
}

Expected Response:
{
  "message": "Issue updated successfully",
  "issue": { ...updated issue },
  "statusChanged": true,
  "costReportRequired": false
}
```

## Common Issues & Solutions

### Notification Bell Not Showing
- Verify NotificationBell is imported in StaffNav/AdminSidebar
- Check browser console for import errors
- Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- Clear localStorage and reload

### Notifications Not Appearing
- Verify notification endpoint is registered in server.js
- Check network tab for API calls to /notifications
- Verify user is authenticated
- Check MongoDB connection

### Cost Report Modal Not Showing
- Verify task status actually changed to "completed"
- Check browser console for component errors
- Verify CostReportModal is imported in StaffTaskDetail
- Try refreshing the page

### Status Transitions Not Working
- Verify user role has permission (staff can only change assigned tasks)
- Check current status allows the transition
- Try logging out and back in
- Clear cache and try again

## Success Checklist

After completing all steps, verify:
- [x] Issue can be created by tenant
- [x] Admin receives notification of new issue
- [x] Admin can assign issue to staff
- [x] Status auto-changes to "assigned"
- [x] Staff receives notification
- [x] Tenant receives notification
- [x] Staff can change status to "in progress"
- [x] Staff can change status to "completed"
- [x] Cost report modal appears on completion
- [x] All parties receive status change notifications
- [x] Notification bell shows all notifications
- [x] Notifications can be marked as read
- [x] Notifications can be deleted
- [x] Unread count updates correctly

## Next Steps

Once basic testing passes:
1. Test with multiple concurrent users
2. Test notification persistence after page reload
3. Test status transitions with invalid statuses
4. Test permissions for different roles
5. Create test cases for bulk operations
6. Test real-time updates with polling

## Support

If you encounter issues:
1. Check browser console for JavaScript errors
2. Check network tab for API errors (look for 4xx/5xx responses)
3. Check MongoDB logs for database errors
4. Review STATUS_CYCLE_IMPLEMENTATION.md for detailed documentation
5. Verify all required files are created
6. Verify imports in modified files are correct
