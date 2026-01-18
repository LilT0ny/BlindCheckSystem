import React, { useState, useEffect } from 'react';
import { ClipboardList, KeyRound, GraduationCap, Users, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../services/api';

const SubdecanoDashboard = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [solicitudesRes, docentesRes, estudiantesRes] = await Promise.all([
        api.get('/subdecano/solicitudes'),
        api.get('/subdecano/docentes'),
        api.get('/subdecano/estudiantes')
      ]);

      setSolicitudes(solicitudesRes.data);
      setDocentes(docentesRes.data);
      setEstudiantes(estudiantesRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: 'badge-warning',
      aprobada: 'badge-success',
      rechazada: 'badge-error',
      en_revision: 'badge-info',
      calificada: 'badge-success'
    };
    return badges[estado] || 'badge-info';
  };

  if (loading) {
    return (
      <Layout title="Dashboard Subdecano">
        <div className="text-center mt-4">
          <span className="loading"></span>
          <p>Cargando...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard Subdecano">
      <div className="dashboard-grid">
        {/* Estadísticas */}
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-number">
              {solicitudes.filter(s => s.estado === 'pendiente').length}
            </div>
            <div className="stat-label">Solicitudes Pendientes</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{docentes.length}</div>
            <div className="stat-label">Docentes</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{estudiantes.length}</div>
            <div className="stat-label">Estudiantes</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{solicitudes.length}</div>
            <div className="stat-label">Total Solicitudes</div>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Gestión</h2>
          </div>
          <div className="quick-actions">
            <Link to="/subdecano/solicitudes" className="btn btn-primary gap-2">
              <ClipboardList size={20} /> Ver Solicitudes
            </Link>
            <Link to="/subdecano/reset-password" className="btn btn-warning gap-2">
              <KeyRound size={20} /> Reset de Contraseña
            </Link>
            <Link to="/subdecano/docentes" className="btn btn-secondary gap-2">
              <GraduationCap size={20} /> Gestionar Docentes
            </Link>
            <Link to="/subdecano/estudiantes" className="btn btn-secondary gap-2">
              <Users size={20} /> Gestionar Estudiantes
            </Link>
            <Link to="/subdecano/materias" className="btn btn-secondary gap-2">
              <BookOpen size={20} /> Gestionar Materias
            </Link>
          </div>
        </div>

        {/* Solicitudes pendientes */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Solicitudes Pendientes de Aprobación</h2>
          </div>
          <div className="solicitudes-list">
            {solicitudes.filter(s => s.estado === 'pendiente').length === 0 ? (
              <p className="text-center text-gray">No hay solicitudes pendientes</p>
            ) : (
              solicitudes
                .filter(s => s.estado === 'pendiente')
                .slice(0, 5)
                .map((sol) => (
                  <div key={sol.id} className="solicitud-item">
                    <div className="solicitud-info">
                      <h3>{sol.materia_nombre}</h3>
                      <p className="text-gray">
                        Estudiante: {sol.estudiante_nombre_anonimo}
                      </p>
                      <p className="text-sm text-gray">
                        Grupo: {sol.grupo} | Aporte: {sol.aporte}
                      </p>
                      <p className="text-sm text-gray">
                        {new Date(sol.fecha_creacion).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div className="solicitud-actions">
                      <span className={`badge ${getEstadoBadge(sol.estado)}`}>
                        {sol.estado}
                      </span>
                      <Link
                        to="/subdecano/solicitudes"
                        className="btn btn-secondary"
                      >
                        Gestionar
                      </Link>
                    </div>
                  </div>
                ))
            )}
          </div>
          {solicitudes.filter(s => s.estado === 'pendiente').length > 5 && (
            <div className="text-center mt-3">
              <Link to="/subdecano/solicitudes" className="btn btn-outline">
                Ver todas las solicitudes
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SubdecanoDashboard;
