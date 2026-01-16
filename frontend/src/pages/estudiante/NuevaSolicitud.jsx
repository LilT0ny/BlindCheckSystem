import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import AlertModal from '../../components/AlertModal';
import api from '../../services/api';
import './NuevaSolicitud.css';

const NuevaSolicitud = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [opcionesSolicitud, setOpcionesSolicitud] = useState([]);
  const [opcionesSeleccionada, setOpcionesSeleccionada] = useState(null);
  const [alert, setAlert] = useState({ show: false, type: 'info', title: '', message: '' });
  
  const [formData, setFormData] = useState({
    materia_id: '',
    docente_id: '',
    grupo: '',
    aporte: '',
    calificacion_actual: '',
    motivo: ''
  });

  useEffect(() => {
    cargarOpciones();
  }, []);

  const cargarOpciones = async () => {
    try {
      // Cargar SOLO las opciones que tienen evidencias disponibles
      const res = await api.get('/estudiante/opciones-solicitud');
      setOpcionesSolicitud(res.data);
      setLoading(false);
      
      if (res.data.length === 0) {
        console.log('⚠️ No hay evidencias disponibles para solicitar recalificaciones');
      } else {
        console.log(`✅ ${res.data.length} opciones de solicitud disponibles`);
      }
    } catch (error) {
      console.error('Error al cargar opciones:', error);
      setLoading(false);
    }
  };

  const handleOpcionChange = (e) => {
    const index = parseInt(e.target.value);
    const opcion = opcionesSolicitud[index];
    
    if (opcion) {
      setOpcionesSeleccionada(opcion);
      setFormData({
        materia_id: opcion.materia_id,
        docente_id: opcion.docente_id,
        grupo: opcion.grupo,
        aporte: opcion.aporte,
        calificacion_actual: '',
        motivo: ''
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/estudiante/solicitudes', formData);
      setAlert({
        show: true,
        type: 'success',
        title: '✅ Éxito',
        message: 'Solicitud creada exitosamente'
      });
      setTimeout(() => navigate('/estudiante/solicitudes'), 1500);
    } catch (error) {
      console.error('Error:', error);
      setAlert({
        show: true,
        type: 'error',
        title: '❌ Error',
        message: error.response?.data?.detail || 'Error desconocido al crear solicitud'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && opcionesSolicitud.length === 0) {
    return (
      <Layout title="Nueva Solicitud">
        <div className="text-center mt-4">
          <span className="loading"></span>
        </div>
      </Layout>
    );
  }

  if (opcionesSolicitud.length === 0) {
    return (
      <Layout title="Nueva Solicitud de Recalificación">
        <div className="card max-w-2xl mx-auto">
          <div className="card-header">
            <h2 className="card-title">📝 Nueva Solicitud</h2>
          </div>
          <div className="alert alert-info">
            <p>📚 No hay evidencias disponibles en el sistema para solicitar recalificaciones.</p>
            <p>Por favor, espera a que los docentes suban las evidencias de los aportes.</p>
          </div>
          <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
            <button
              onClick={() => navigate('/estudiante/dashboard')}
              className="btn btn-primary"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Nueva Solicitud de Recalificación">
      <AlertModal 
        show={alert.show}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ ...alert, show: false })}
      />
      <div className="card max-w-2xl mx-auto">
        <div className="card-header">
          <h2 className="card-title">📝 Nueva Solicitud</h2>
        </div>
        <form onSubmit={handleSubmit} className="form">
          {/* Selector de opción precargada */}
          <div className="form-group">
            <label htmlFor="opcion" className="form-label">
              Elige una opción disponible *
              <span className="badge badge-info" style={{ marginLeft: '10px' }}>
                {opcionesSolicitud.length} opción{opcionesSolicitud.length !== 1 ? 'es' : ''} disponible{opcionesSolicitud.length !== 1 ? 's' : ''}
              </span>
            </label>
            <select
              id="opcion"
              onChange={handleOpcionChange}
              className="form-select"
              required
            >
              <option value="">Selecciona una opción</option>
              {opcionesSolicitud.map((opcion, index) => (
                <option key={index} value={index}>
                  {opcion.materia_nombre} ({opcion.materia_id}) - {opcion.docente_nombre} - Grupo {opcion.grupo} - {opcion.aporte}
                </option>
              ))}
            </select>
          </div>

          {/* Detalles de la opción seleccionada (solo lectura) */}
          {opcionesSeleccionada && (
            <div className="option-details">
              <div className="detail-row">
                <div className="detail-group">
                  <label className="detail-label">Materia</label>
                  <p className="detail-value">{opcionesSeleccionada.materia_nombre}</p>
                </div>
                <div className="detail-group">
                  <label className="detail-label">Código</label>
                  <p className="detail-value">{opcionesSeleccionada.materia_id}</p>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-group">
                  <label className="detail-label">Docente</label>
                  <p className="detail-value">{opcionesSeleccionada.docente_nombre}</p>
                </div>
                <div className="detail-group">
                  <label className="detail-label">Grupo</label>
                  <p className="detail-value">{opcionesSeleccionada.grupo}</p>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-group">
                  <label className="detail-label">Aporte</label>
                  <p className="detail-value">{opcionesSeleccionada.aporte}</p>
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="calificacion_actual" className="form-label">
              Calificación Actual (sobre 10) *
            </label>
            <input
              type="number"
              id="calificacion_actual"
              name="calificacion_actual"
              value={formData.calificacion_actual}
              onChange={handleChange}
              className="form-input"
              min="0"
              max="10"
              step="0.1"
              placeholder="Ingresa tu calificación actual"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="motivo" className="form-label">Motivo de la Solicitud *</label>
            <textarea
              id="motivo"
              name="motivo"
              value={formData.motivo}
              onChange={handleChange}
              className="form-textarea"
              rows="5"
              placeholder="Explica detalladamente el motivo de tu solicitud..."
              required
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/estudiante/dashboard')}
              className="btn btn-outline"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !opcionesSeleccionada}
            >
              {loading ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default NuevaSolicitud;
