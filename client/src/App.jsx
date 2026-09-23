import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './routes/ProtectedRoute';
import AppLayout from './layouts/AppLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectLayout from './pages/ProjectLayout';
import ProjectBoard from './pages/ProjectBoard';
import ProjectBacklog from './pages/ProjectBacklog';
import ProjectSprints from './pages/ProjectSprints';
import ProjectIssues from './pages/ProjectIssues';
import ProjectSettings from './pages/ProjectSettings';
import IssueDetail from './pages/IssueDetail';
import Notifications from './pages/Notifications';
import Search from './pages/Search';
import MyIssues from './pages/MyIssues';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import AdminOverview from './pages/Admin/AdminOverview';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminAuditLogs from './pages/Admin/AdminAuditLogs';
import NotFound from './pages/NotFound';

import './styles/app.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />

                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:projectId" element={<ProjectLayout />}>
                  <Route index element={<ProjectBoard />} />
                  <Route path="backlog" element={<ProjectBacklog />} />
                  <Route path="sprints" element={<ProjectSprints />} />
                  <Route path="issues" element={<ProjectIssues />} />
                  <Route path="settings" element={<ProjectSettings />} />
                </Route>

                <Route path="/issues/:id" element={<IssueDetail />} />

                <Route path="/notifications" element={<Notifications />} />
                <Route path="/search" element={<Search />} />
                <Route path="/my-issues" element={<MyIssues />} />
                <Route path="/profile" element={<Profile />} />

                <Route element={<ProtectedRoute roles={['ADMIN']} />}>
                  <Route path="/admin" element={<Admin />}>
                    <Route index element={<AdminOverview />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="audit-logs" element={<AdminAuditLogs />} />
                  </Route>
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
