const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Routes
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/issues', require('./routes/issueRoutes'));
// app.use('/api/tasks', require('./routes/taskRoutes'));
// app.use('/api/payments', require('./routes/paymentRoutes'));
// app.use('/api/invoices', require('./routes/invoiceRoutes'));
// app.use('/api/ai', require('./routes/aiRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
