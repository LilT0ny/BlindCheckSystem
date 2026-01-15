import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../services/api';
import './NuevaSolicitud.css';

const NuevaSolicitud = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [materias, setMaterias] = useState([]);
  const [todosDocentes, setTodosDocentes] = useState([]);
  const [docentesFiltrados, setDocentesFiltrados] = useState([]);
  
  const [formData, setFormData] = useState({
    materia_id: '',
    docente_id: '',
    grupo: '',
    aporte: '',
    calificacion_actual: '',
    motivo: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // Cargar materias y docentes desde estudiante endpoints
      const [materiasRes, docentesRes] = await Promise.all([
        api.get('/estudiante/materias'),
        api.get('/estudiante/docentes')
      ]);
      setMaterias(materiasRes.data);
      setTodosDocentes(docentesRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });

    // Si cambia la materia, filtrar docentes
    if (name === 'materia_id' && value) {
      const materiaSeleccionada = materias.find(m => m.id === value);
      if (materiaSeleccionada) {
        // Filtrar docentes que tengan esta materia asignada
        const docentesDeLaMateria = todosDocentes.filter(doc => 
          doc.materias && doc.materias.includes(value)
        );
        setDocentesFiltrados(docentesDeLaMateria);
        // Limpiar selección de docente si ya había una
        setFormData(prev => ({ ...prev, docente_id: '' }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/estudiante/solicitudes', formData);
      alert('✅ Solicitud creada exitosamente');
      navigate('/estudiante/solicitudes');
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al crear solicitud: ' + (error.response?.data?.detail || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Nueva Solicitud de Recalificación">
      <div className="card max-w-2xl mx-auto">
        <div className="card-header">
          <h2 className="card-title">📝 Nueva Solicitud</h2>
        </div>
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="materia_id" className="form-label">Materia *</label>
            <select
              id="materia_id"
              name="materia_id"
              value={formData.materia_id}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">Selecciona una materia</option>
              {materias.map((mat) => (
                <option key={mat.id} value={mat.id}>
                  {mat.nombre} ({mat.codigo})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="docente_id" className="form-label">Docente *</label>
            <select
              id="docente_id"
              name="docente_id"
              value={formData.docente_id}
              onChange={handleChange}
              className="form-select"
              required
              disabled={!formData.materia_id}
            >
              <option value="">
                {!formData.materia_id 
                  ? 'Primero selecciona una materia' 
                  : docentesFiltrados.length === 0 
                    ? 'No hay docentes para esta materia'
                    : 'Selecciona un docente'
                }
              </option>
              {docentesFiltrados.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="grupo" className="form-label">Grupo *</label>
              <input
                type="text"
                id="grupo"
                name="grupo"
                value={formData.grupo}
                onChange={handleChange}
                className="form-input"
                placeholder="Ej: GR1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="aporte" className="form-label">Aporte *</label>
              <select
                id="aporte"
                name="aporte"
                value={formData.aporte}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Selecciona</option>
                <option value="Prueba 1">Prueba 1</option>
                <option value="Examen 1">Examen 1</option>
                <option value="Prueba 2">Prueba 2</option>
                <option value="Examen 2">Examen 2</option>
              </select>
            </div>
          </div>

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
              disabled={loading}
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
