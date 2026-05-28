# Quick Reference Guide

## Most Important Files to Review

### Backend Core Implementation (Priority 1)
1. **`/tenantflow-backend/models/Notification.js`** - Core notification storage schema
2. **`/tenantflow-backend/services/notificationService.js`** - All notification logic
3. **`/tenantflow-backend/controllers/issueController.js`** - Updated status logic + notifications
4. **`/tenantflow-backend/models/Issue.js`** - Updated schema with status history

### Frontend Core Implementation (Priority 1)
5. **`/tenantflow-backend/tenantflow_frontend/src/hooks/useNotifications.js`** - Notification state management
6. **`/tenantflow-backend/tenantflow_frontend/src/components/NotificationBell.jsx`** - Notification UI
7. **`/tenantflow-backend/tenantflow_frontend/src/pages/StaffTaskDetail.jsx`** - Cost report modal integration

### Configuration (Priority 2)
8. **`/tenantflow-backend/server.js`** - Registered notification routes
9. **`/tenantflow-backend/tenantflow_frontend/src/api.js`** - API endpoints

### Documentation (Reference)
10. **`STATUS_CYCLE_IMPLEMENTATION.md`** - Complete technical documentation
11. **`TESTING_QUICK_START.md`** - Testing procedures
12. **`IMPLEMENTATION_CHANGES.md`** - All changes summary

## Status Cycle At a Glance

```
TENANT PERSPECTIVE:
┌─────────────────────────────────────────┐
│ Reports Issue (new)                     │
│ ↓ Notified issue received               │
│ Staff Assigned (assigned)               │
│ ↓ Notified staff assigned               │
│ Work in Progress (in progress)          │
│ ↓ Notified work started                 │
│ Completed (completed)                   │
│ ↓ Notified work done                    │
└─────────────────────────────────────────┘

STAFF PERSPECTIVE:
┌─────────────────────────────────────────┐
│ Receives Task (assigned)                │
│ Click "Start Work" (in progress)        │
│ Work on Issue...                        │
│ Click "Mark Completed" (completed)      │
│ Fill Cost Report                        │
│ Submit Report                           │
└─────────────────────────────────────────┘

ADMIN PERSPECTIVE:
┌─────────────────────────────────────────┐
│ Notified New Issue                      │
│ Review Issue Details                    │
│ Select Staff & Assign                   │
│ Status Auto → assigned                  │
│ Monitor Progress                        │
│ Track to Completion                     │
└─────────────────────────────────────────┘
```

## Key Notifications Sent

| Event | Sent To | Message |
|-------|---------|---------|
| Issue Reported | Admin | New Issue Reported - Issue Type, Location |
| Task Assigned | Staff | Task Assigned to You - Task details + link |
| Task Assigned | Tenant | Staff Member Assigned - Staff name |
| Task Assigned | Admin | Confirmation of assignment |
| Status → In Progress | Staff | Confirmation work started |
| Status → In Progress | Tenant | Work Started - Staff name |
| Status → In Progress | Admin | Staff started work |
| Status → Completed | Staff | Complete work + create cost report |
| Status → Completed | Tenant | Task Completed - Staff name |
| Status → Completed | Admin | Task completion update |

## API Endpoints Quick Reference

### Issue Endpoints
```
POST   /issues              Create new issue (triggers admin notification)
GET    /issues?status=all   Get all issues (includes status history)
GET    /issues/:id          Get issue details
PUT    /issues/:id          Update status (auto-notifies all parties)
DELETE /issues/:id          Delete issue
```

**Update Issue Body Example:**
```json
{
  "status": "in progress",
  "resolutionNotes": "Working on fixing the leak"
}
```

### Notification Endpoints
```
GET    /notifications              Get all notifications
GET    /notifications/unread/count Get unread count
PUT    /notifications/:id/read     Mark as read
PUT    /notifications/read-all     Mark all as read
DELETE /notifications/:id          Delete notification
DELETE /notifications/clear-all    Clear all
```

## Frontend Component Usage

### Using NotificationBell
```jsx
import NotificationBell from '../components/NotificationBell';

function MyNav() {
  return (
    <nav>
      {/* Other nav items */}
      <NotificationBell />
    </nav>
  );
}
```

### Using useNotifications Hook
```jsx
import { useNotifications } from '../hooks/useNotifications';

function MyComponent() {
  const {
    notifications,        // Array of notifications
    unreadCount,         // Number of unread
    markAsRead,          // Function to mark one as read
    deleteNotification   // Function to delete one
  } = useNotifications();

  return (
    <div>
      <p>Unread: {unreadCount}</p>
      {notifications.map(n => (
        <div key={n._id}>
          <p>{n.title}</p>
          <button onClick={() => markAsRead(n._id)}>
            Mark as read
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Using CostReportModal
```jsx
import CostReportModal from '../components/CostReportModal';

function TaskDetail() {
  const [showModal, setShowModal] = useState(false);

  const handleCostReportSubmit = async (data) => {
    // data = { description, laborCost, materialsCost, otherCost, notes }
    console.log('Cost report:', data);
    // Send to backend
    setShowModal(false);
  };

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Create Cost Report
      </button>
      {showModal && (
        <CostReportModal
          issue={issue}
          onClose={() => setShowModal(false)}
          onSubmit={handleCostReportSubmit}
        />
      )}
    </>
  );
}
```

## Testing in 5 Minutes

```bash
# 1. Start servers (already running)
# 2. Login as admin

# 3. Check notification bell
Click notification bell → Should work

# 4. Trigger notification (tenant reports issue)
Switch to tenant tab → Report issue → Submit

# 5. Check admin notifications
Switch to admin → Click notification bell
→ Should see "New Issue Reported"

# 6. Test assignment
Go to task assignment → Select issue → Select staff → Assign
→ All parties should get notifications

# Success! Status cycle working
```

## Debugging Checklist

- [ ] NotificationBell component visible in header?
- [ ] Can click notification bell without errors?
- [ ] Notifications appear after issue report?
- [ ] Notifications appear after task assignment?
- [ ] Staff can change status without errors?
- [ ] Cost report modal appears on completion?
- [ ] Unread count badge shows?
- [ ] Can mark notifications as read?
- [ ] Notifications disappear when deleted?

## Common Commands

### Check MongoDB Collections
```javascript
// Check notifications
db.notifications.find().pretty()

// Check issue status history
db.issues.findOne({_id: ObjectId("...")})

// Count unread notifications
db.notifications.countDocuments({ isRead: false })
```

### Check Backend Logs
```
Look for patterns:
- "Error creating notification"
- "notifyTaskAssigned"
- "Notification created"
- Status-related error messages
```

### Check Frontend Console
```
Errors to look for:
- Import errors for NotificationBell
- API call failures
- State management issues
- Component rendering errors
```

## Performance Considerations

### Current Implementation
- Notifications fetched every 30 seconds
- Max 50 notifications per request
- No pagination limitation

### Optimization Tips
- Implement virtual scrolling for large notification lists
- Use WebSocket for real-time updates in Phase 2
- Add notification archival after 30 days
- Implement read status indexes for faster queries

## Security Considerations

### Current Implementation
- All endpoints require authentication
- Users can only see their own notifications
- No permission escalation possible

### Future Enhancements
- Add rate limiting on notification API
- Implement notification encryption
- Add audit logging for sensitive status changes
- Implement notification signing

## Known Limitations (Phase 1)

1. **Cost Report Data**: Not persisted to database
   - Solution: Implement Invoice model in Phase 2

2. **Notifications Not Real-Time**: 30-second polling
   - Solution: Implement WebSocket in Phase 2

3. **No Notification Preferences**: Users get all notifications
   - Solution: Add preference system in Phase 2

4. **No Bulk Notifications**: Sent individually
   - Solution: Optimize in Phase 2 if performance issues arise

5. **Limited Notification History**: No archival
   - Solution: Implement archival in Phase 3

## Integration Checklist

### Before Going Live
- [ ] Database migration complete
- [ ] All files created/modified
- [ ] Backend restarted
- [ ] Frontend rebuilt
- [ ] Manual testing complete (TESTING_QUICK_START.md)
- [ ] User acceptance testing scheduled
- [ ] Backup of database taken
- [ ] Rollback plan documented

### After Going Live
- [ ] Monitor error logs for issues
- [ ] Check notification delivery rates
- [ ] Monitor server performance
- [ ] Get user feedback
- [ ] Plan Phase 2 enhancements

## Support Quick Links

- **Full Documentation**: [STATUS_CYCLE_IMPLEMENTATION.md](STATUS_CYCLE_IMPLEMENTATION.md)
- **Testing Guide**: [TESTING_QUICK_START.md](TESTING_QUICK_START.md)
- **Changes Summary**: [IMPLEMENTATION_CHANGES.md](IMPLEMENTATION_CHANGES.md)

## Contact & Questions

For questions about implementation:
1. Review relevant section in documentation
2. Check troubleshooting section
3. Review code comments
4. Check browser console and network logs
