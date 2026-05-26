Tenantflow - Individual Project
This is an apartment maintenance facilitation application developed using MERN.


Features:

- User authentication
- Issue management
- Task tracking
- Cost management
- Invoice generation
- Payment processing (Sandbox PayHere integration)
- Role-based access control

Project Structure:


├── config/           # Configuration files
├── controllers/      # Request handlers
├── routes/          # API routes
├── models/          # Data models
├── middleware/      # Custom middleware
├── services/        # Business logic
├── utils/           # Utility functions
└── server.js        # Entry point



Prerequisites:

- Node.js (v14 or higher)
- npm or yarn

Installation:

1. Clone the repository
bash
git clone <repository-url>
cd tenantflow-backend

2. Install dependencies
bash
npm install


3. Create a `.env` file with required environment variables

PORT=5000
OPENAI_API_KEY=your_openai_api_key
PAYHERE_MERCHANT_ID=your_payhere_merchant_id
PAYHERE_MERCHANT_SECRET=your_payhere_merchant_secret

4. Start the server

npm start

5. To run the application
npm run dev


API Endpoints:

Public (No Login Required):

POST /auth/tenant-register
POST /auth/staff-register
POST /auth/login
POST /payments/notify (PayHere callback)

Tenant:

GET /auth/profile
PUT /auth/profile
PUT /auth/password
POST /issues (report issue with media)
GET /issues (gets only logged-in tenant’s issues)
GET /issues/:id (tenant can only access own issue)
GET /invoices (gets only logged-in tenant’s invoices)
GET /invoices/:id (only own invoice)
POST /payments/initiate
GET /payments
GET /payments/:orderId
DELETE /payments/:id

Staff:

GET /auth/profile
PUT /auth/profile
PUT /auth/password
GET /issues (gets only issues assigned to logged-in staff)
GET /issues/:id
PUT /issues/:id (status/progress updates)

Admin / Property Manager:

GET /auth/profile
PUT /auth/profile
PUT /auth/password
GET /auth/staff/pending
GET /auth/staff/approved
GET /auth/staff/:id
PUT /auth/staff/:id/status
GET /auth/tenants
GET /issues (admin can see all issues)
GET /issues/:id
PUT /issues/:id
DELETE /issues/:id
POST /invoices
GET /invoices (currently returns invoices by logged-in user id, so admin behavior may need adjustment if you expect all invoices)
GET /invoices/:id
PUT /invoices/:id
DELETE /invoices/:id

