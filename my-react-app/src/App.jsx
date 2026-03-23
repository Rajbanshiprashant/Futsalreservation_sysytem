
import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Payment from './pages/Payment';
import PaymentSuccess from './pages/PaymentSuccess';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import Reservations from './pages/Reservations';
import ProtectedRoute from './components/routing/ProtectedRoute.jsx';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/reservations"
        element={(
          <ProtectedRoute>
            <Reservations />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/dashboard"
        element={(
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/payment"
        element={(
          <ProtectedRoute>
            <Payment />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/payment/success"
        element={(
          <ProtectedRoute>
            <PaymentSuccess />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/admin"
        element={(
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        )}
      />
      <Route path="/contact" element={<Contact />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

