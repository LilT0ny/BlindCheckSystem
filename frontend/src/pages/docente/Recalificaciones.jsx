import React, { useState, useEffect } from 'react';
import { ClipboardList, Paperclip, Edit, Check, CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import Layout from '../../components/Layout';
import AlertModal from '../../components/AlertModal';
import api from '../../services/api';
import './Recalificaciones.css';

const Recalificaciones = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('aprobada');
  const [showModal, setShowModal] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [alert, setAlert] = useState({ show: false, type: 'info', title: '', message: '' });
  const [formCalificacion, setFormCalificacion] = useState({
    nota: '',
    comentario: ''
  });

  useEffect(() => {
    cargarRecalificaciones();
  }, []);

  const cargarRecalificaciones = async () => {
    try {
      const response = await api.get('/docente/recalificaciones');
      setSolicitudes(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalCalificar = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setFormCalificacion({ nota: '', comentario: '' });
    setShowModal(true);
  };

  const verEvidencia = async (solicitud) => {
    try {
      const response = await api.get(`/docente/recalificaciones/${solicitud.id}/evidencia`);
      if (response.data && response.data.archivo_url) {
        // archivo_url ya viene con / al inicio, no agregar otro /
        const url = `${import.meta.env.VITE_BACKEND_URL.replace('/api', '')}${response.data.archivo_url}`;
        window.open(url, '_blank');
      } else {
        setAlert({ show: true, type: 'warning', title: 'Aviso', message: 'No se encontró evidencia para esta solicitud' });
      }
    } catch (error) {
      console.error('Error:', error);
      setAlert({ show: true, type: 'error', title: 'Error', message: 'Error al obtener evidencia: ' + (error.response?.data?.detail || 'Error desconocido') });
    }
  };

  const handleSubmitCalificacion = async (e) => {
    e.preventDefault();

    const nota = parseFloat(formCalificacion.nota);
    if (isNaN(nota) || nota < 0 || nota > 10) {
      setAlert({ show: true, type: 'error', title: 'Error', message: 'Calificación debe estar entre 0 y 10' });
      return;
    }

    try {
      await api.post(`/docente/recalificaciones/${solicitudSeleccionada.id}/calificar`, {
        nota: nota,
        comentario: formCalificacion.comentario
      });
      setAlert({ show: true, type: 'success', title: 'Éxito', message: 'Calificación registrada exitosamente' });
      setShowModal(false);
      cargarRecalificaciones();
    } catch (error) {
      console.error('Error:', error);
      setAlert({ show: true, type: 'error', title: 'Error', message: 'Error al calificar: ' + (error.response?.data?.detail || 'Error desconocido') });
    }
  };

  const solicitudesFiltradas = solicitudes.filter(sol => {
    if (filtro === 'todas') return true;
    // Para docentes, 'aprobada' incluye tanto 'aprobada' como 'en_revision'
    if (filtro === 'aprobada') return sol.estado === 'aprobada' || sol.estado === 'en_revision';
    return sol.estado === filtro;
  });

  const getEstadoBadge = (estado) => {
    const badges = {
      aprobada: 'badge-success',
      en_revision: 'badge-info',
      calificada: 'badge-success'
    };
    return badges[estado] || 'badge-info';
  };

  if (loading) {
    return (
      <Layout title="Recalificaciones">
        <div className="text-center mt-4">
          <span className="loading"></span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Recalificaciones">
      <AlertModal
        show={alert.show}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ ...alert, show: false })}
      />
      <div className="recalificaciones-container">
        <div className="recalificaciones-header">
          <h2 className="flex items-center gap-2">
            <ClipboardList className="w-6 h-6" /> Recalificaciones Asignadas
          </h2>
        </div>

        <div className="filtros">
          <button
            className={`filtro-btn ${filtro === 'aprobada' ? 'active' : ''}`}
            onClick={() => setFiltro('aprobada')}
          >
            Aprobadas ({solicitudes.filter(s => s.estado === 'aprobada' || s.estado === 'en_revision').length})
          </button>
          <button
            className={`filtro-btn ${filtro === 'calificada' ? 'active' : ''}`}
            onClick={() => setFiltro('calificada')}
          >
            Calificadas ({solicitudes.filter(s => s.estado === 'calificada').length})
          </button>
          <button
            className={`filtro-btn ${filtro === 'todas' ? 'active' : ''}`}
            onClick={() => setFiltro('todas')}
          >
            Todas ({solicitudes.length})
          </button>
        </div>

        <div className="recalificaciones-table">
          <table>
            <thead>
              <tr>
                <th>Estudiante (Anónimo)</th>
                <th>Materia</th>
                <th>Grupo</th>
                <th>Aporte</th>
                <th>Calif. Actual</th>
                <th>Motivo</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {solicitudesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center">
                    No hay recalificaciones {filtro !== 'todas' ? `en estado "${filtro}"` : ''}
                  </td>
                </tr>
              ) : (
                solicitudesFiltradas.map((sol) => (
                  <tr key={sol.id}>
                    <td><strong>{sol.estudiante_nombre_anonimo}</strong></td>
                    <td>{sol.materia_nombre}</td>
                    <td>{sol.grupo}</td>
                    <td>{sol.aporte}</td>
                    <td><strong>{sol.calificacion_actual}/10</strong></td>
                    <td>
                      <div className="motivo-truncate" title={sol.motivo}>
                        {sol.motivo}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getEstadoBadge(sol.estado)}`}>
                        {sol.estado}
                      </span>
                    </td>
                    <td>{new Date(sol.fecha_creacion).toLocaleDateString('es-ES')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => verEvidencia(sol)}
                          className="btn btn-sm btn-info flex items-center gap-1"
                          title="Ver evidencia del estudiante"
                        >
                          <Paperclip className="w-4 h-4" /> Ver Evidencia
                        </button>
                        {(sol.estado === 'aprobada' || sol.estado === 'en_revision') && (
                          <button
                            onClick={() => abrirModalCalificar(sol)}
                            className="btn btn-sm btn-primary flex items-center gap-1"
                          >
                            <Edit className="w-4 h-4" /> Calificar
                          </button>
                        )}
                        {sol.estado === 'calificada' && (
                          <span className="text-success flex items-center gap-1">
                            <Check className="w-4 h-4" /> Calificada
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {solicitudes.length === 0 && (
          <div className="empty-state">
            <p>No tienes recalificaciones asignadas aún</p>
          </div>
        )}

        {/* Modal de Calificación */}
        {showModal && solicitudSeleccionada && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Calificar Solicitud</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowModal(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="modal-body">
                <div className="info-solicitud">
                  <p><strong>Estudiante:</strong> {solicitudSeleccionada.estudiante_nombre_anonimo}</p>
                  <p><strong>Materia:</strong> {solicitudSeleccionada.materia_nombre}</p>
                  <p><strong>Grupo:</strong> {solicitudSeleccionada.grupo} | <strong>Aporte:</strong> {solicitudSeleccionada.aporte}</p>
                  <p><strong>Calificación Actual:</strong> {solicitudSeleccionada.calificacion_actual}/10</p>
                  <p><strong>Motivo:</strong> {solicitudSeleccionada.motivo}</p>
                </div>

                <form onSubmit={handleSubmitCalificacion}>
                  <div className="form-group">
                    <label htmlFor="nota">Nueva Calificación (0-10) *</label>
                    <input
                      type="number"
                      id="nota"
                      step="0.1"
                      min="0"
                      max="10"
                      value={formCalificacion.nota}
                      onChange={(e) => setFormCalificacion({ ...formCalificacion, nota: e.target.value })}
                      placeholder="Ej: 8.5"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="comentario">Comentario (opcional)</label>
                    <textarea
                      id="comentario"
                      rows="4"
                      value={formCalificacion.comentario}
                      onChange={(e) => setFormCalificacion({ ...formCalificacion, comentario: e.target.value })}
                      placeholder="Agrega un comentario sobre la recalificación..."
                    />
                  </div>

                  <div className="modal-actions">
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setShowModal(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" /> Registrar Calificación
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Recalificaciones;
