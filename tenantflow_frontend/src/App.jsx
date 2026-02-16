import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import TenantDashboard from './pages/TenantDashboard';
import ReportIssue from './pages/ReportIssue';
import ReviewIssue from './pages/ReviewIssue';
import Profile from './pages/Profile';
import StaffDashboard from './pages/StaffDashboard';
import Payment from './pages/Payment';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/tenant-dashboard" element={<TenantDashboard />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />
        <Route path="/report-issue" element={<ReportIssue />} />
        <Route path="/report-issue/review" element={<ReviewIssue />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/staff-dashboard" element={<StaffDashboard />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
