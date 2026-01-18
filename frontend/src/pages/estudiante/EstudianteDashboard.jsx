import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ClipboardList, Mail, User } from 'lucide-react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import './EstudianteDashboard.css';

const EstudianteDashboard = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [solicitudesRes, mensajesRes] = await Promise.all([
        api.get('/estudiante/solicitudes'),
        api.get('/estudiante/mensajes')
      ]);

      setSolicitudes(solicitudesRes.data);
      setMensajes(mensajesRes.data.filter(m => !m.leido).slice(0, 5));
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

  const getEstadoTexto = (estado) => {
    const textos = {
      pendiente: 'Pendiente',
      aprobada: 'Aprobada',
      rechazada: 'Rechazada',
      en_revision: 'En Revisión',
      calificada: 'Calificada'
    };
    return textos[estado] || estado;
  };

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="text-center mt-4">
          <span className="loading"></span>
          <p>Cargando...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      <div className="dashboard-grid">
        {/* Resumen */}
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-number">{solicitudes.length}</div>
            <div className="stat-label">Total Solicitudes</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {solicitudes.filter(s => s.estado === 'pendiente').length}
            </div>
            <div className="stat-label">Pendientes</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {solicitudes.filter(s => s.estado === 'calificada').length}
            </div>
            <div className="stat-label">Calificadas</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{mensajes.length}</div>
            <div className="stat-label">Mensajes sin leer</div>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Acciones Rápidas</h2>
          </div>
          <div className="quick-actions">
            <Link to="/estudiante/nueva-solicitud" className="btn btn-primary flex items-center justify-center gap-2">
              <FileText className="w-5 h-5" /> Nueva Solicitud
            </Link>
            <Link to="/estudiante/solicitudes" className="btn btn-secondary flex items-center justify-center gap-2">
              <ClipboardList className="w-5 h-5" /> Ver Solicitudes
            </Link>
            <Link to="/estudiante/mensajes" className="btn btn-outline flex items-center justify-center gap-2">
              <Mail className="w-5 h-5" /> Mensajes
            </Link>
            <Link to="/estudiante/perfil" className="btn btn-outline flex items-center justify-center gap-2">
              <User className="w-5 h-5" /> Mi Perfil
            </Link>
          </div>
        </div>

        {/* Solicitudes recientes */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Solicitudes Recientes</h2>
          </div>
          <div className="solicitudes-list">
            {solicitudes.length === 0 ? (
              <p className="text-center text-gray">No tienes solicitudes aún</p>
            ) : (
              solicitudes.slice(0, 5).map((sol) => (
                <div key={sol.id} className="solicitud-item">
                  <div className="solicitud-info">
                    <h3>{sol.materia_nombre}</h3>
                    <p className="text-gray">
                      Grupo: {sol.grupo} | Aporte: {sol.aporte}
                    </p>
                    <p className="text-sm text-gray">
                      {new Date(sol.fecha_creacion).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className="solicitud-actions">
                    <span className={`badge ${getEstadoBadge(sol.estado)}`}>
                      {getEstadoTexto(sol.estado)}
                    </span>
                    <Link
                      to="/estudiante/solicitudes"
                      className="btn btn-sm btn-secondary"
                    >
                      Ver Todas
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mensajes recientes */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Notificaciones Recientes</h2>
          </div>
          <div className="mensajes-list">
            {mensajes.length === 0 ? (
              <p className="text-center text-gray">No hay mensajes nuevos</p>
            ) : (
              mensajes.map((msg) => (
                <div key={msg.id} className="mensaje-item">
                  <div className="mensaje-icon"><Mail className="w-5 h-5" /></div>
                  <div className="mensaje-content">
                    <h4>{msg.asunto}</h4>
                    <p className="text-sm text-gray">{msg.contenido.substring(0, 100)}...</p>
                    <p className="text-xs text-gray">
                      {new Date(msg.fecha_envio).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EstudianteDashboard;
