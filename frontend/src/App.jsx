import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import EstudianteDashboard from './pages/estudiante/EstudianteDashboard';
import NuevaSolicitud from './pages/estudiante/NuevaSolicitud';
import Solicitudes from './pages/estudiante/Solicitudes';
import DocenteDashboard from './pages/docente/DocenteDashboard';
import Recalificaciones from './pages/docente/Recalificaciones';
import Evidencias from './pages/docente/Evidencias';
import SubdecanoDashboard from './pages/subdecano/SubdecanoDashboard';
import GestionSolicitudes from './pages/subdecano/GestionSolicitudes';
import GestionDocentes from './pages/subdecano/GestionDocentes';
import GestionEstudiantes from './pages/subdecano/GestionEstudiantes';
import { useAuthStore } from './store/authStore';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    // Restaurar sesión al cargar la app
    restoreSession();
  }, [restoreSession]);

  return (
    <Router>
      <Routes>
        {/* Ruta pública */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
        />

        {/* Ruta raíz - redirige según el rol */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <RoleBasedRedirect />
            </ProtectedRoute>
          } 
        />

        {/* Rutas de Estudiante */}
        <Route 
          path="/estudiante/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['estudiante']}>
              <EstudianteDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/estudiante/nueva-solicitud" 
          element={
            <ProtectedRoute allowedRoles={['estudiante']}>
              <NuevaSolicitud />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/estudiante/solicitudes" 
          element={
            <ProtectedRoute allowedRoles={['estudiante']}>
              <Solicitudes />
            </ProtectedRoute>
          } 
        />

        {/* Rutas de Docente */}
        <Route 
          path="/docente/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['docente']}>
              <DocenteDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/docente/recalificaciones" 
          element={
            <ProtectedRoute allowedRoles={['docente']}>
              <Recalificaciones />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/docente/evidencias" 
          element={
            <ProtectedRoute allowedRoles={['docente']}>
              <Evidencias />
            </ProtectedRoute>
          } 
        />

        {/* Rutas de Subdecano */}
        <Route 
          path="/subdecano/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['subdecano']}>
              <SubdecanoDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/subdecano/solicitudes" 
          element={
            <ProtectedRoute allowedRoles={['subdecano']}>
              <GestionSolicitudes />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/subdecano/docentes" 
          element={
            <ProtectedRoute allowedRoles={['subdecano']}>
              <GestionDocentes />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/subdecano/estudiantes" 
          element={
            <ProtectedRoute allowedRoles={['subdecano']}>
              <GestionEstudiantes />
            </ProtectedRoute>
          } 
        />

        {/* Ruta 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

// Componente para redirigir según el rol del usuario
const RoleBasedRedirect = () => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'estudiante':
      return <Navigate to="/estudiante/dashboard" replace />;
    case 'docente':
      return <Navigate to="/docente/dashboard" replace />;
    case 'subdecano':
      return <Navigate to="/subdecano/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default App;
