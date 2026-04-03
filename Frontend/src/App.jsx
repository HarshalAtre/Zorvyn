import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login      from './pages/Login';
import Register   from './pages/Register';
import Dashboard  from './pages/Dashboard';
import Records    from './pages/Records';
import Analytics  from './pages/Analytics';
import Users      from './pages/Users';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />

          <Route path="/records" element={
            <ProtectedRoute roles={['analyst','admin']}><Records /></ProtectedRoute>
          } />

          <Route path="/analytics" element={
            <ProtectedRoute roles={['analyst','admin']}><Analytics /></ProtectedRoute>
          } />

          <Route path="/users" element={
            <ProtectedRoute roles={['admin']}><Users /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
