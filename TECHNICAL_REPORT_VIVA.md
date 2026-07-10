# TenantFlow Technical Report and Viva Preparation Guide

## 1. Project Overview

TenantFlow is an apartment maintenance facilitation system built with the MERN stack. The project supports three main user roles:

- Tenant: registers under a building/unit, reports maintenance issues, tracks repair progress, receives invoices, and makes payments.
- Staff: registers with skills and availability, receives assigned tasks, updates task progress, and submits cost reports.
- Admin / Property Manager: manages buildings, approves staff registrations, assigns issues to staff, reviews cost reports, generates invoices, and monitors payments.

The main problem solved by TenantFlow is the lack of a structured workflow for apartment repair reporting and payment handling. Instead of tenants reporting issues informally, the system creates a controlled process from issue reporting to staff assignment, task completion, cost approval, invoice generation, and payment confirmation.

## 2. Objectives

The main objectives of the project are:

- To digitize the apartment maintenance request process.
- To provide role-based access for tenants, staff, and property managers.
- To track every issue through a clear status lifecycle.
- To allow media-supported issue reporting.
- To support staff approval and task assignment.
- To manage repair cost reporting and manager approval.
- To generate invoices and connect payments through PayHere sandbox.
- To notify relevant users when important events happen.

## 3. Technology Stack

Frontend:

- React 19
- Vite
- React Router DOM
- Axios
- Tailwind CSS / CSS styling
- jsPDF for receipt/document generation support

Backend:

- Node.js
- Express.js
- MongoDB with Mongoose
- JSON Web Tokens for authentication
- bcryptjs for password hashing
- multer for file uploads
- PayHere sandbox integration for payments

Database:

- MongoDB document database
- Mongoose schemas and relationships through ObjectId references

## 4. High-Level Architecture

TenantFlow follows a client-server architecture.

The React frontend sends HTTP requests through a centralized Axios API layer in `src/api.js`. The backend exposes Express routes such as `/auth`, `/issues`, `/tasks`, `/cost-reports`, `/invoices`, `/payments`, `/notifications`, and `/buildings`. Controllers handle request logic, services handle reusable business logic such as notifications and payments, and Mongoose models represent the database collections.

Main backend layers:

- `server.js`: application entry point, middleware setup, route registration, database connection, scheduler startup.
- `routes/`: maps API endpoints to controller functions.
- `controllers/`: handles request validation, authorization decisions, database updates, and responses.
- `models/`: defines MongoDB document structures.
- `middleware/`: authentication, role checking, and uploads.
- `services/`: notification, payment, AI, and reminder logic.
- `utils/`: token generation and PayHere hash verification.

## 5. Important Modules

### Authentication and Authorization

Authentication is implemented using JWT tokens. During login, the backend verifies the email and password, checks the selected role, and returns a token. The frontend stores the token in local storage and attaches it to future requests using an Axios request interceptor.

Passwords are hashed in the `User` model using a Mongoose pre-save hook and bcrypt.

Authorization is based on roles:

- `authMiddleware` verifies the JWT and attaches the logged-in user to `req.user`.
- `roleMiddleware` checks whether the logged-in user has one of the allowed roles.
- Some workflows also perform controller-level ownership checks, such as ensuring a tenant can only access their own issue and staff can only update assigned issues.

### Building and Unit Management

Buildings contain floors and units. During tenant registration, the selected building, floor, and unit are validated. If the unit is available, it is marked as occupied and linked to the new tenant.

This avoids multiple tenants registering for the same apartment unit.

### Issue Management

Tenants can report issues with:

- Issue type: plumbing, electrical, cleaning, carpentry, or other.
- Building/floor/unit from their profile.
- Specific location inside the unit.
- Description.
- Urgency.
- Special arrangements.
- Uploaded media files.

The issue is initially created with status `new`. If the tenant's building has a property manager, the issue is assigned to that manager and a notification is created.

### Task Assignment and Status Lifecycle

The issue itself works as the central repair record. Admins/property managers assign a staff member to the issue. After assignment, the issue status changes from `new` to `assigned`.

Main issue status lifecycle:

1. `new`
2. `assigned`
3. `in progress`
4. `tenant confirmed`
5. `completed`
6. `cost report submitted`
7. `cost report rejected` or `invoice issued`
8. `payment pending`
9. `payment done`
10. `task done`

Important transition rules:

- Admin can assign staff and update issue management fields.
- Staff can start work by changing `assigned` to `in progress`.
- Tenant confirms work while the task is in progress.
- Staff marks the task as completed after tenant confirmation.
- Completion triggers the cost report process.

This lifecycle is one of the strongest technical parts of the project because it prevents uncontrolled status changes.

### Cost Report Workflow

After a task is completed, the assigned staff member creates a cost report. A cost report contains itemized repair costs such as labor, materials, transport, and other costs.

Cost report statuses:

- `draft`: staff is preparing the report.
- `submitted`: sent to manager for review.
- `approved`: accepted by manager.
- `rejected`: returned to staff with remarks.

When a rejected report is resubmitted, the revision number increases and the previous version is stored. The audit trail records important actions such as creation, update, submission, approval, and rejection.

### Invoice Generation

When a manager approves a cost report, the backend automatically creates an invoice. The invoice contains:

- Tenant reference.
- Issue reference.
- Cost report reference.
- Invoice number.
- Issue title/type.
- Location.
- Cost breakdown.
- Total amount.
- Payment status.

The issue is then updated to `invoice issued`.

### Payment Processing

Payments are handled through PayHere sandbox integration.

Payment flow:

1. Tenant selects an invoice.
2. Frontend calls `/payments/initiate`.
3. Backend creates a payment record and builds a PayHere checkout payload.
4. PayHere returns notification data to `/payments/notify`.
5. Backend verifies the PayHere hash.
6. If payment is successful, payment status becomes `paid`.
7. Invoice status becomes `paid`.
8. Issue status becomes `payment done`.
9. Staff and property manager receive payment notifications.

This design keeps a payment record even before final confirmation, which is useful for tracking pending or failed transactions.

### Notifications

The notification service creates notifications for key events:

- New issue reported.
- Task assigned.
- Task status changed.
- Tenant confirmed task completion.
- Cost report required.
- Cost report submitted.
- Cost report approved or rejected.
- Invoice sent.
- Payment received.
- Scheduled task start date passed.

The notification model supports unread/read states and action URLs so the frontend can take users directly to the relevant screen.

### Reminder Scheduler

The backend starts a reminder scheduler when the server starts. It checks every hour for assigned issues whose scheduled start date has passed but have not yet moved to `in progress`. It then sends notifications to the staff member and property manager and marks the reminder as sent.

## 6. Database Design

Important collections:

### User

Stores tenants, staff, and admins in one collection. The role field decides which extra fields are required.

Key fields:

- `name`, `email`, `password`, `phone`
- `role`
- tenant fields: `building`, `floor`, `unit`, `nic`, `profileImage`
- staff fields: `primaryDepartment`, `secondarySkills`, `workStatus`, `availability`, `bank details`, `status`
- admin fields: managed buildings

### Building

Stores apartment buildings, floors, units, and property managers.

Key fields:

- `name`, `address`, `city`
- `totalFloors`
- `propertyManagers`
- `floors.units`
- unit occupancy fields

### Issue

Stores the full repair request and lifecycle.

Key fields:

- `tenant`
- `issueType`
- `building`, `floor`, `unit`
- `description`, `urgency`, `media`
- `status`, `priority`
- `assignedTo`, `propertyManager`
- `statusHistory`
- `currentCostReport`
- `invoice`
- payment tracking fields

### CostReport

Stores repair cost details and approval history.

Key fields:

- `issue`
- `createdBy`
- `approvedBy`
- `costItems`
- `totalCost`
- `costBreakdown`
- `status`
- `auditTrail`
- `revisionNumber`
- `previousVersions`

### Invoice

Stores generated invoices for approved costs.

Key fields:

- `tenant`
- `issue`
- `costReport`
- `invoiceNumber`
- `total`
- `paymentStatus`
- `paymentMethod`
- `paymentReference`

### Payment

Stores PayHere payment attempts and confirmations.

Key fields:

- `tenant`
- `invoice`
- `orderId`
- `amount`
- `currency`
- `status`
- `payherePaymentId`
- `checkoutSnapshot`
- `rawNotify`

## 7. API Summary

Authentication:

- `POST /auth/tenant-register`
- `POST /auth/staff-register`
- `POST /auth/login`
- `GET /auth/profile`
- `PUT /auth/profile`
- `PUT /auth/password`
- `GET /auth/staff/pending`
- `GET /auth/staff/approved`
- `PUT /auth/staff/:id/status`
- `GET /auth/tenants`

Issues:

- `POST /issues`
- `GET /issues`
- `GET /issues/:id`
- `PUT /issues/:id`
- `DELETE /issues/:id`

Cost Reports:

- `POST /cost-reports`
- `GET /cost-reports/:id`
- `GET /cost-reports/issue/:issueId`
- `GET /cost-reports/manager/pending`
- `PUT /cost-reports/:id`
- `POST /cost-reports/:id/submit`
- `POST /cost-reports/:id/approve`
- `POST /cost-reports/:id/reject`

Invoices:

- `POST /invoices`
- `GET /invoices`
- `GET /invoices/:id`
- `POST /invoices/:id/send`
- `PUT /invoices/:id`
- `DELETE /invoices/:id`

Payments:

- `POST /payments/initiate`
- `POST /payments/notify`
- `GET /payments`
- `GET /payments/tenant-payments`
- `GET /payments/staff-payments`
- `GET /payments/:orderId`
- `DELETE /payments/:id`

Buildings:

- `GET /buildings`
- `GET /buildings/:id`
- `GET /buildings/:buildingId/available-units`
- `POST /buildings/check-availability`
- `POST /buildings/occupy-unit`
- `POST /buildings/assign-manager`

## 8. Frontend Design

The frontend is structured around pages for different roles.

Tenant pages:

- Home
- Registration and login
- Tenant dashboard
- Report issue
- Review issue
- Invoices
- Payment
- Payment success/cancel
- Profile

Staff pages:

- Staff dashboard
- Staff availability
- Staff profile
- Staff task detail
- Staff cost report page
- Staff tenant payments

Admin pages:

- Admin dashboard
- Staff approval
- Staff list and detail view
- Task assignment
- In-progress repairs
- Repair detail
- Cost report detail
- Properties
- Tenant payments
- Admin profile

The frontend uses `src/api.js` as the central API client. This avoids repeating Axios setup across components and makes token handling consistent.

## 9. Security Considerations

Implemented security features:

- Passwords are hashed using bcrypt before storage.
- JWT authentication protects private routes.
- Role-based middleware protects admin-only routes.
- Controller-level authorization checks protect issue ownership and staff assignment ownership.
- PayHere notifications are verified using hash validation.
- File uploads are handled using multer.
- Staff users cannot log in until approved by admin.

Areas that can be improved:

- Store JWT secret only in environment variables and avoid fallback secrets in production.
- Add stricter route-level role middleware to all sensitive routes.
- Add file size/type validation and virus scanning for uploads.
- Add centralized error handling middleware.
- Add rate limiting for login and registration endpoints.
- Add automated test coverage for status transitions and payment callbacks.

## 10. Testing Strategy

Manual testing can be performed using the UI and Postman collection.

Recommended viva demo flow:

1. Register or log in as tenant.
2. Report an issue with location, urgency, and media.
3. Log in as admin and view the new issue.
4. Assign the issue to an approved staff member.
5. Log in as staff and start the task.
6. Log in as tenant and confirm progress/completion.
7. Log in as staff and mark task completed.
8. Create and submit a cost report.
9. Log in as admin and approve or reject the cost report.
10. If approved, show invoice generation.
11. Log in as tenant and initiate PayHere sandbox payment.
12. Show payment history and updated issue status.

Important test cases:

- Tenant cannot view another tenant's issue.
- Staff cannot update an issue assigned to another staff member.
- Pending staff cannot log in.
- Occupied units cannot be selected by another tenant.
- Cost report cannot be submitted without items.
- Cost report cannot be approved unless it is submitted.
- Payment notification with invalid hash is rejected.

## 11. Strengths of the Project

- Complete real-world workflow from issue reporting to payment.
- Clear separation between frontend, backend routes, controllers, models, services, and middleware.
- Role-based system with different dashboards and permissions.
- Media upload support for issue evidence.
- Staff approval system before allowing staff login.
- Structured status lifecycle with status history.
- Cost report approval/rejection with audit trail and revision tracking.
- PayHere sandbox payment integration.
- Notification system for important events.
- Reminder scheduler for delayed task starts.

## 12. Limitations and Future Improvements

Current limitations:

- Some route files rely on controller checks instead of applying role middleware directly on every sensitive endpoint.
- Automated tests are not clearly present in the project.
- Payment flow depends on external PayHere callback behavior.
- Upload validation can be made stronger.
- Admin invoice visibility may need refinement depending on expected business rules.
- The building release route should be reviewed because the route currently maps `release-unit` to the occupy function.

Future improvements:

- Add Jest/Supertest backend tests and frontend component tests.
- Add centralized validation with a schema validation library.
- Add audit logs for admin actions.
- Add email/SMS notifications.
- Add dashboards with analytics, repair time, and payment reports.
- Add real-time updates using WebSockets.
- Add stronger production security: HTTPS, secure cookies, rate limits, and stricter CORS.

## 13. Viva Questions and Suggested Answers

### Q1. What is TenantFlow?

TenantFlow is a MERN-based apartment maintenance management system. It allows tenants to report repair issues, property managers to assign staff, staff to update work progress and submit cost reports, and tenants to pay generated invoices through PayHere sandbox.

### Q2. Why did you choose the MERN stack?

MERN provides one language, JavaScript, across both frontend and backend. React is suitable for role-based dashboards, Express provides lightweight API development, MongoDB fits document-based entities like issues and cost reports, and Node.js works well for asynchronous API and payment workflows.

### Q3. How is authentication handled?

The backend validates email and password, compares the password using bcrypt, and returns a JWT token. The frontend stores that token and sends it in the Authorization header. The backend middleware verifies the token and loads the user into `req.user`.

### Q4. How do you protect role-specific features?

I use role-based access control. Some routes use `roleMiddleware`, and controllers also check ownership and role rules. For example, a tenant can only view their own issues, and staff can only update issues assigned to them.

### Q5. Why do you keep tenants, staff, and admins in one User model?

They share common fields like name, email, password, phone, and role. Role-specific fields are conditionally required. This reduces duplication while still allowing tenant and staff-specific data.

### Q6. Explain the issue lifecycle.

An issue starts as `new`. After the manager assigns staff, it becomes `assigned`. Staff starts work and changes it to `in progress`. The tenant confirms the work, then staff marks it `completed`. After that, staff submits a cost report, the manager approves it, an invoice is issued, payment is made, and the status moves to `payment done`.

### Q7. How does cost report approval work?

Only the assigned staff member can create and edit the report. The report starts as draft, then staff submits it. The manager can approve or reject it. If rejected, remarks are stored and the staff can resubmit. Revisions and audit trail entries preserve history.

### Q8. How is an invoice generated?

When a manager approves a submitted cost report, the backend automatically creates an invoice using the cost report total and breakdown. The invoice is linked to the tenant, issue, cost report, and property manager.

### Q9. How does PayHere payment integration work?

The tenant initiates payment for an invoice. The backend creates a payment record and PayHere checkout payload. When PayHere sends a notification, the backend verifies the hash. If valid and successful, the payment, invoice, and issue statuses are updated.

### Q10. How do notifications work?

There is a notification service that creates notification documents for key events. For example, when a tenant reports an issue, the property manager is notified. When staff is assigned, the staff member and tenant are notified. When payment is received, staff and manager are notified.

### Q11. What is the purpose of status history?

Status history provides traceability. It records what status was set, who changed it, when it changed, and why. This is important for accountability in maintenance workflows.

### Q12. What was the most challenging part?

The most challenging part was coordinating the full workflow between roles. A change by one role affects what another role can do next, so the status lifecycle and permissions had to be carefully controlled.

### Q13. What are the main security features?

Password hashing, JWT authentication, role-based authorization, staff approval before login, ownership checks, and PayHere hash verification.

### Q14. What would you improve if you had more time?

I would add automated tests, strengthen upload validation, add centralized input validation, improve route-level role protection, add real-time notifications, and prepare the system for production deployment with stronger security settings.

### Q15. How can you prove this project is not only CRUD?

The system has a business workflow with state transitions, approval processes, payment integration, notifications, audit trails, scheduled reminders, and role-dependent behavior. These go beyond simple create/read/update/delete operations.

## 14. Short Presentation Script

Good morning. My project is TenantFlow, an apartment maintenance facilitation system developed using the MERN stack.

The system is designed for three user roles: tenants, staff members, and property managers. A tenant can register under a specific building unit, report maintenance issues with media evidence, track repair status, receive invoices, and make payments. Staff members can register, wait for admin approval, receive assigned tasks, update task progress, and submit cost reports. The property manager can approve staff, assign tasks, review cost reports, generate invoices, and monitor tenant payments.

The backend is built with Express and MongoDB. I used Mongoose models for users, buildings, issues, cost reports, invoices, payments, and notifications. Authentication is handled using JWT, and passwords are securely hashed using bcrypt. The frontend is built with React and Vite, with role-specific pages and a centralized Axios API layer.

The main workflow starts when a tenant reports an issue. The issue is assigned to a property manager and then to staff. Staff starts work, the tenant confirms the work, and staff completes the task. After completion, staff submits a cost report. The manager can approve or reject it. If approved, the system generates an invoice and the tenant can pay through PayHere sandbox. Once PayHere confirms payment, the payment, invoice, and issue statuses are updated.

The strongest parts of my project are the role-based workflow, controlled status transitions, cost report approval process, payment integration, notification system, and audit trail. If I continue improving the project, I would add automated testing, stronger production security, and real-time updates.

## 15. Files to Know Before the Viva

Backend:

- `tenantflow-backend/server.js`: Express app entry point.
- `tenantflow-backend/config/db.js`: MongoDB connection.
- `tenantflow-backend/models/User.js`: users, roles, password hashing.
- `tenantflow-backend/models/Issue.js`: issue lifecycle and status history.
- `tenantflow-backend/models/CostReport.js`: cost items, approval, audit trail.
- `tenantflow-backend/models/Invoice.js`: invoice data and payment status.
- `tenantflow-backend/models/Payment.js`: PayHere payment records.
- `tenantflow-backend/controllers/authController.js`: registration, login, staff approval.
- `tenantflow-backend/controllers/issueController.js`: issue creation and status updates.
- `tenantflow-backend/controllers/costReportController.js`: cost report workflow.
- `tenantflow-backend/controllers/paymentController.js`: PayHere payment handling.
- `tenantflow-backend/services/notificationService.js`: notification events.
- `tenantflow-backend/services/reminderScheduler.js`: overdue start reminders.

Frontend:

- `tenantflow_frontend/src/App.jsx`: frontend route definitions.
- `tenantflow_frontend/src/api.js`: centralized API client and token interceptor.
- `tenantflow_frontend/src/pages/TenantDashboard.jsx`: tenant dashboard.
- `tenantflow_frontend/src/pages/ReportIssue.jsx`: issue reporting.
- `tenantflow_frontend/src/pages/StaffDashboard.jsx`: staff dashboard.
- `tenantflow_frontend/src/pages/StaffTaskDetail.jsx`: staff task updates.
- `tenantflow_frontend/src/pages/StaffCostReportPage.jsx`: staff cost report UI.
- `tenantflow_frontend/src/pages/AdminDashboard.jsx`: admin dashboard.
- `tenantflow_frontend/src/pages/AdminTaskAssignment.jsx`: staff assignment.
- `tenantflow_frontend/src/pages/AdminCostReportDetail.jsx`: cost report approval.
- `tenantflow_frontend/src/pages/Payment.jsx`: tenant payment flow.

## 16. Final Viva Tip

When answering, always connect code to the business workflow. For example, do not only say "I used JWT"; say "I used JWT so that only authenticated users can access role-specific maintenance actions, and the backend can know whether the requester is a tenant, staff member, or admin."

That style shows both technical understanding and system design thinking.
