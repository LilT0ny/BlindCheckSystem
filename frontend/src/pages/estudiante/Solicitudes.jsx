import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Plus, X, ArrowRight } from 'lucide-react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import './Solicitudes.css';

const Solicitudes = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [showModal, setShowModal] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    try {
      const response = await api.get('/estudiante/solicitudes');
      setSolicitudes(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const verDetalles = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setShowModal(true);
  };

  const solicitudesFiltradas = solicitudes.filter(sol => {
    if (filtro === 'todas') return true;
    return sol.estado === filtro;
  });

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
      <Layout title="Mis Solicitudes">
        <div className="text-center mt-4">
          <span className="loading"></span>
          <p>Cargando...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Mis Solicitudes">
      <div className="solicitudes-container">
        <div className="solicitudes-header">
          <h2 className="flex items-center gap-2">
            <ClipboardList className="w-6 h-6" /> Mis Solicitudes de Recalificación
          </h2>
          <Link to="/estudiante/nueva-solicitud" className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nueva Solicitud
          </Link>
        </div>

        <div className="filtros">
          <button
            className={`filtro-btn ${filtro === 'todas' ? 'active' : ''}`}
            onClick={() => setFiltro('todas')}
          >
            Todas ({solicitudes.length})
          </button>
          <button
            className={`filtro-btn ${filtro === 'pendiente' ? 'active' : ''}`}
            onClick={() => setFiltro('pendiente')}
          >
            Pendientes ({solicitudes.filter(s => s.estado === 'pendiente').length})
          </button>
          <button
            className={`filtro-btn ${filtro === 'aprobada' ? 'active' : ''}`}
            onClick={() => setFiltro('aprobada')}
          >
            Aprobadas ({solicitudes.filter(s => s.estado === 'aprobada').length})
          </button>
          <button
            className={`filtro-btn ${filtro === 'calificada' ? 'active' : ''}`}
            onClick={() => setFiltro('calificada')}
          >
            Calificadas ({solicitudes.filter(s => s.estado === 'calificada').length})
          </button>
        </div>

        <div className="solicitudes-grid">
          {solicitudesFiltradas.length === 0 ? (
            <div className="empty-state">
              <p>No tienes solicitudes {filtro !== 'todas' ? `en estado "${getEstadoTexto(filtro)}"` : ''}</p>
              <Link to="/estudiante/nueva-solicitud" className="btn btn-primary">
                Crear Primera Solicitud
              </Link>
            </div>
          ) : (
            solicitudesFiltradas.map((sol) => (
              <div key={sol.id} className="solicitud-card">
                <div className="solicitud-card-header">
                  <h3>{sol.materia_nombre}</h3>
                  <span className={`badge ${getEstadoBadge(sol.estado)}`}>
                    {getEstadoTexto(sol.estado)}
                  </span>
                </div>
                <div className="solicitud-card-body">
                  <p><strong>Grupo:</strong> {sol.grupo}</p>
                  <p><strong>Aporte:</strong> {sol.aporte}</p>
                  <p><strong>Calificación Actual:</strong> {sol.calificacion_actual}/10</p>
                  <p><strong>Docente:</strong> {sol.docente_nombre_anonimo}</p>
                  <p className="text-sm text-gray">
                    <strong>Fecha:</strong> {new Date(sol.fecha_creacion).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div className="solicitud-card-footer">
                  <button
                    onClick={() => verDetalles(sol)}
                    className="btn btn-outline btn-sm flex items-center gap-1"
                  >
                    Ver Detalles <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal de Detalles */}
        {showModal && solicitudSeleccionada && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Detalles de la Solicitud</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowModal(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="modal-body">
                <div className="detalle-row">
                  <span className="detalle-label">Estado:</span>
                  <span className={`badge ${getEstadoBadge(solicitudSeleccionada.estado)}`}>
                    {getEstadoTexto(solicitudSeleccionada.estado)}
                  </span>
                </div>

                <div className="detalle-row">
                  <span className="detalle-label">Materia:</span>
                  <span>{solicitudSeleccionada.materia_nombre}</span>
                </div>

                <div className="detalle-row">
                  <span className="detalle-label">Grupo:</span>
                  <span>{solicitudSeleccionada.grupo}</span>
                </div>

                <div className="detalle-row">
                  <span className="detalle-label">Aporte:</span>
                  <span>{solicitudSeleccionada.aporte}</span>
                </div>

                <div className="detalle-row">
                  <span className="detalle-label">Calificación Actual:</span>
                  <span><strong>{solicitudSeleccionada.calificacion_actual}/10</strong></span>
                </div>

                {solicitudSeleccionada.calificacion_nueva && (
                  <div className="detalle-row">
                    <span className="detalle-label">Nueva Calificación:</span>
                    <span className="text-success"><strong>{solicitudSeleccionada.calificacion_nueva}/10</strong></span>
                  </div>
                )}

                <div className="detalle-row">
                  <span className="detalle-label">Docente (Anónimo):</span>
                  <span>{solicitudSeleccionada.docente_nombre_anonimo}</span>
                </div>

                <div className="detalle-section">
                  <span className="detalle-label">Motivo de la Solicitud:</span>
                  <p className="detalle-texto">{solicitudSeleccionada.motivo}</p>
                </div>

                {solicitudSeleccionada.comentario_docente && (
                  <div className="detalle-section">
                    <span className="detalle-label">Comentario del Docente:</span>
                    <p className="detalle-texto">{solicitudSeleccionada.comentario_docente}</p>
                  </div>
                )}

                {solicitudSeleccionada.motivo_rechazo && (
                  <div className="detalle-section detalle-rechazo">
                    <span className="detalle-label">Motivo de Rechazo:</span>
                    <p className="detalle-texto">{solicitudSeleccionada.motivo_rechazo}</p>
                  </div>
                )}

                <div className="detalle-row">
                  <span className="detalle-label">Fecha de Creación:</span>
                  <span>{new Date(solicitudSeleccionada.fecha_creacion).toLocaleString('es-ES')}</span>
                </div>

                {solicitudSeleccionada.fecha_actualizacion && (
                  <div className="detalle-row">
                    <span className="detalle-label">Última Actualización:</span>
                    <span>{new Date(solicitudSeleccionada.fecha_actualizacion).toLocaleString('es-ES')}</span>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-primary"
                  onClick={() => setShowModal(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Solicitudes;
