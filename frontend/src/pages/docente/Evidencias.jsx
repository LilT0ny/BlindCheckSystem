import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import AlertModal from '../../components/AlertModal';
import ImagePixelator from '../../components/ImagePixelator';
import api from '../../services/api';
import './Evidencias.css';

const Evidencias = () => {
  const [evidencias, setEvidencias] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState(1); // 1: Form, 2: Pixelar, 3: Guardando
  const [tempData, setTempData] = useState(null);
<<<<<<< HEAD
  const [cropArea, setCropArea] = useState(null);
  const [evidenciaSeleccionada, setEvidenciaSeleccionada] = useState(null);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: 'info', title: '', message: '' });
  
  // useRef para mantener la referencia actualizada del área
  const cropAreaRef = React.useRef(null);
  
=======
  const [pixelateArea, setPixelateArea] = useState(null);

>>>>>>> origin/main
  const [formData, setFormData] = useState({
    estudiante_id: '',
    materia_id: '',
    grupo: '',
    aporte: '',
    descripcion: '',
    archivo: null
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [evidenciasRes, materiasRes, estudiantesRes] = await Promise.all([
        api.get('/docente/evidencias'),
        api.get('/docente/materias'),
        api.get('/docente/estudiantes')
      ]);
      setEvidencias(evidenciasRes.data);
      setMaterias(materiasRes.data);
      setEstudiantes(estudiantesRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setAlert({ show: true, type: 'error', title: '❌ Error', message: 'Error al cargar evidencias' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setAlert({ show: true, type: 'error', title: '❌ Error', message: 'Solo se permiten archivos de imagen' });
        return;
      }
      setFormData(prev => ({ ...prev, archivo: file }));
    }
  };

  const handleUploadTemp = async (e) => {
    e.preventDefault();

    if (!formData.archivo) {
      setAlert({ show: true, type: 'warning', title: '⚠️ Aviso', message: 'Debes seleccionar una imagen' });
      return;
    }

    if (!formData.estudiante_id) {
      setAlert({ show: true, type: 'warning', title: '⚠️ Aviso', message: 'Debes seleccionar un estudiante' });
      return;
    }

    setUploading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('archivo', formData.archivo);
      formDataToSend.append('estudiante_id', formData.estudiante_id);
      formDataToSend.append('materia_id', formData.materia_id);
      formDataToSend.append('grupo', formData.grupo);
      formDataToSend.append('aporte', formData.aporte);

      const response = await api.post('/docente/evidencias/upload-temp', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setTempData(response.data);
      setStep(2);
    } catch (error) {
      console.error('Error al subir evidencia:', error);
      setAlert({ show: true, type: 'error', title: '❌ Error', message: error.response?.data?.detail || 'Error al subir evidencia temporal' });
    } finally {
      setUploading(false);
    }
  };

  const handleAreaSelected = (area) => {
    console.log('📍 handleAreaSelected llamado con:', area);
    console.log('📍 Tipo de area:', typeof area, area);
    // Guardar en ref inmediatamente
    cropAreaRef.current = area;
    console.log('📍 cropAreaRef.current después de guardar:', cropAreaRef.current);
    // También actualizar estado para UI
    setCropArea(area);
    console.log('📍 Estado cropArea actualizado a:', area);
  };

  const handleFinalizar = async () => {
    // Usar el ref que siempre tiene el valor más reciente
    const areaToCrop = cropAreaRef.current;
    
    console.log('🔍 Pre-validación:');
    console.log('   - cropArea (estado):', cropArea);
    console.log('   - cropAreaRef.current:', areaToCrop);
    
    setUploading(true);
    setStep(3);

    try {
<<<<<<< HEAD
=======
      // Capturar el área actual antes de cualquier cambio de estado
      const areaToPixelate = pixelateArea;

>>>>>>> origin/main
      const payload = {
        temp_filename: tempData.temp_filename,
        estudiante_id: formData.estudiante_id,
        materia_id: formData.materia_id,
        grupo: formData.grupo,
        aporte: formData.aporte,
        descripcion: formData.descripcion,
        crop_area: areaToCrop
      };

      console.log('📦 Payload enviado al backend:', payload);
      console.log('🎯 Área de recorte (capturada):', areaToCrop);

      const response = await api.post('/docente/evidencias/recortar', payload);

<<<<<<< HEAD
      setAlert({ show: true, type: 'success', title: '✅ Éxito', message: `Evidencia guardada exitosamente!\nCódigo: ${response.data.codigo_interno}\nHash: ${response.data.archivo_hash}` });
      
=======
      alert(`✅ Evidencia guardada exitosamente!\n🔑 Código: ${response.data.codigo_interno}\n📁 Hash: ${response.data.archivo_hash}`);

>>>>>>> origin/main
      // Resetear todo
      setShowModal(false);
      setStep(1);
      setFormData({
        estudiante_id: '',
        materia_id: '',
        grupo: '',
        aporte: '',
        descripcion: '',
        archivo: null
      });
      setTempData(null);
      setCropArea(null);
      cropAreaRef.current = null;
      cargarDatos();
    } catch (error) {
      console.error('Error al guardar evidencia:', error);
      setAlert({ show: true, type: 'error', title: '❌ Error', message: error.response?.data?.detail || 'Error al guardar evidencia' });
      setStep(2);
    } finally {
      setUploading(false);
    }
  };

  const handleCancelar = () => {
    setShowModal(false);
    setStep(1);
    setFormData({
      estudiante_id: '',
      materia_id: '',
      grupo: '',
      aporte: '',
      descripcion: '',
      archivo: null
    });
    setTempData(null);
    setCropArea(null);
    cropAreaRef.current = null;
  };

  const handleVerDetalle = (evidencia) => {
    setEvidenciaSeleccionada(evidencia);
    setShowDetalleModal(true);
  };

  const handleCerrarDetalle = () => {
    setShowDetalleModal(false);
    setEvidenciaSeleccionada(null);
  };

  if (loading) {
    return (
      <Layout title="Evidencias">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando evidencias...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Gestión de Evidencias">
      <AlertModal 
        show={alert.show}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ ...alert, show: false })}
      />
      <div className="evidencias-container">
        <div className="evidencias-header">
          <div>
            <h2>📸 Mis Evidencias</h2>
            <p className="text-gray">Fotos de evaluaciones con anonimato garantizado</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            ➕ Subir Nueva Evidencia
          </button>
        </div>

        {evidencias.length === 0 ? (
          <div className="empty-state">
            <p>📁 No has subido evidencias aún</p>
            <button
              className="btn btn-secondary"
              onClick={() => setShowModal(true)}
            >
              Subir Primera Evidencia
            </button>
          </div>
        ) : (
          <div className="evidencias-grid">
            {evidencias.map((ev) => (
              <div 
                key={ev.id} 
                className="evidencia-card"
                onClick={() => handleVerDetalle(ev)}
                style={{ cursor: 'pointer' }}
              >
                <div className="evidencia-image">
                  <img
                    src={`${import.meta.env.VITE_BACKEND_URL.replace('/api', '')}${ev.archivo_url}`}
                    alt={ev.descripcion}
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999"%3EImagen%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  <div className="evidencia-overlay">
                    <span className="hash-badge">🔒 {ev.archivo_nombre_hash}</span>
                    {ev.recortada && <span className="recortada-badge">✓ Recortada</span>}
                  </div>
                </div>
                <div className="evidencia-info">
                  <h3>{ev.materia_nombre}</h3>
                  {ev.codigo_interno && (
                    <p className="codigo-interno"><strong>🔑 Código:</strong> {ev.codigo_interno}</p>
                  )}
                  <p className="text-sm"><strong>Grupo:</strong> {ev.grupo}</p>
                  <p className="text-sm"><strong>Aporte:</strong> {ev.aporte}</p>
                  <p className="text-sm text-gray">{ev.descripcion}</p>
                  <p className="text-xs text-gray">
                    {new Date(ev.fecha_subida).toLocaleString('es-ES')}
                  </p>
                  <button 
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: '10px', width: '100%' }}
                  >
                    👁️ Ver Detalle
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal para subir evidencia */}
        {showModal && (
          <div className="modal-overlay" onClick={() => !uploading && handleCancelar()}>
            <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2>Subir Nueva Evidencia</h2>
                  <p className="text-sm text-gray">
                    {step === 1 && 'Paso 1: Información de la evidencia'}
                    {step === 2 && 'Paso 2: Marca el área que quieres eliminar (nombre del estudiante)'}
                    {step === 3 && 'Procesando...'}
                  </p>
                </div>
                <button
                  className="modal-close"
                  onClick={handleCancelar}
                  disabled={uploading}
                >
                  ✕
                </button>
              </div>

              {step === 1 && (
                <form onSubmit={handleUploadTemp}>
                  <div className="form-group">
                    <label>Estudiante *</label>
                    <select
                      name="estudiante_id"
                      value={formData.estudiante_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Selecciona el estudiante</option>
                      {estudiantes.map((est) => (
                        <option key={est.id} value={est.id}>
                          {est.nombre} - {est.carrera}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Materia *</label>
                    <select
                      name="materia_id"
                      value={formData.materia_id}
                      onChange={handleChange}
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

                  <div className="form-row">
                    <div className="form-group">
                      <label>Grupo *</label>
                      <input
                        type="text"
                        name="grupo"
                        value={formData.grupo}
                        onChange={handleChange}
                        placeholder="Ej: A1"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Aporte *</label>
                      <select
                        name="aporte"
                        value={formData.aporte}
                        onChange={handleChange}
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
                    <label>Descripción *</label>
                    <textarea
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleChange}
                      placeholder="Describe brevemente esta evidencia"
                      rows="3"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Foto de Evidencia *</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      required
                    />
                    <p className="text-xs text-gray mt-1">
                      📸 En el siguiente paso podrás marcar el área con el nombre para eliminarlo
                    </p>
                  </div>

                  <div className="modal-actions">
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={handleCancelar}
                      disabled={uploading}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={uploading}
                    >
                      {uploading ? 'Cargando...' : '➡️ Siguiente'}
                    </button>
                  </div>
                </form>
              )}

              {step === 2 && tempData && (
<<<<<<< HEAD
                <div className="crop-step">
                  <ImagePixelator 
                    imageUrl={`http://localhost:8000${tempData.preview_url}`}
=======
                <div className="pixelate-step">
                  <ImagePixelator
                    imageUrl={`${import.meta.env.VITE_BACKEND_URL.replace('/api', '')}${tempData.preview_url}`}
>>>>>>> origin/main
                    onAreaSelected={handleAreaSelected}
                  />

                  <div className="modal-actions" style={{ 
                    marginTop: '30px', 
                    padding: '20px', 
                    backgroundColor: cropArea ? '#f0f9ff' : '#fff7ed', 
                    borderRadius: '8px',
                    border: cropArea ? '2px solid #0ea5e9' : '2px solid #fb923c'
                  }}>
                    {cropArea ? (
                      <>
                        <h3 style={{ marginBottom: '15px', color: '#0369a1' }}>
                          ✅ Área marcada - Se eliminará esto y todo lo de arriba
                        </h3>
                        <p style={{ marginBottom: '15px', color: '#0c4a6e', fontSize: '14px' }}>
                          📏 Área a eliminar: {Math.round(cropArea.width)} x {Math.round(cropArea.height)} píxeles
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 style={{ marginBottom: '15px', color: '#c2410c' }}>
                          📸 Guardar imagen completa
                        </h3>
                        <p style={{ marginBottom: '15px', color: '#7c2d12', fontSize: '14px' }}>
                          La imagen se guardará sin recortes. Dibuja un rectángulo para seleccionar solo una parte.
                        </p>
                      </>
                    )}
                    
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleFinalizar}
                      disabled={uploading}
                      style={{
                        fontSize: '18px',
                        padding: '15px 30px',
                        fontWeight: 'bold',
                        width: '100%',
                        marginBottom: '10px'
                      }}
                      title={cropArea ? 'Guardar evidencia con recorte' : 'Guardar evidencia sin recorte'}
                    >
                      {uploading ? 'Procesando...' : '✅ FINALIZAR Y GUARDAR EVIDENCIA'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={handleCancelar}
                      disabled={uploading}
                      style={{ width: '100%' }}
                    >
                      Cancelar todo
                    </button>
                  </div>

                  <p className="text-xs text-center text-gray mt-2">
                    💡 Dibuja un rectángulo sobre el NOMBRE del estudiante para eliminarlo
                  </p>
                  <p className="text-xs text-center text-gray">
                    ℹ️ Se eliminará el área marcada y todo lo que esté arriba
                  </p>
                </div>
              )}

              {step === 3 && (
                <div className="processing-step">
                  <div className="loading-overlay">
                    <span className="loading"></span>
                    <p>Procesando y guardando evidencia...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal para ver detalle de evidencia */}
        {showDetalleModal && evidenciaSeleccionada && (
          <div className="modal-overlay" onClick={handleCerrarDetalle}>
            <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>📸 Detalle de Evidencia</h2>
                <button className="modal-close" onClick={handleCerrarDetalle}>✕</button>
              </div>

              <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ marginBottom: '15px', color: '#0369a1' }}>{evidenciaSeleccionada.materia_nombre}</h3>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '15px',
                    backgroundColor: '#f8fafc',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px'
                  }}>
                    {evidenciaSeleccionada.codigo_interno && (
                      <div>
                        <strong>🔑 Código Interno:</strong>
                        <p style={{ fontSize: '18px', color: '#0369a1', fontFamily: 'monospace', marginTop: '5px' }}>
                          {evidenciaSeleccionada.codigo_interno}
                        </p>
                      </div>
                    )}
                    <div>
                      <strong>🔒 Hash:</strong>
                      <p style={{ fontSize: '14px', color: '#64748b', fontFamily: 'monospace', marginTop: '5px', wordBreak: 'break-all' }}>
                        {evidenciaSeleccionada.archivo_nombre_hash}
                      </p>
                    </div>
                    <div>
                      <strong>Grupo:</strong>
                      <p style={{ marginTop: '5px' }}>{evidenciaSeleccionada.grupo}</p>
                    </div>
                    <div>
                      <strong>Aporte:</strong>
                      <p style={{ marginTop: '5px' }}>{evidenciaSeleccionada.aporte}</p>
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <strong>Descripción:</strong>
                    <p style={{ 
                      marginTop: '8px', 
                      padding: '12px',
                      backgroundColor: '#f1f5f9',
                      borderRadius: '6px',
                      color: '#475569'
                    }}>
                      {evidenciaSeleccionada.descripcion}
                    </p>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <strong>Fecha de subida:</strong>
                    <p style={{ marginTop: '5px', color: '#64748b' }}>
                      {new Date(evidenciaSeleccionada.fecha_subida).toLocaleString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {/* Imagen en grande */}
                <div style={{ 
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: '#f8fafc'
                }}>
                  <img 
                    src={`http://localhost:8000${evidenciaSeleccionada.archivo_url}`}
                    alt={evidenciaSeleccionada.descripcion}
                    style={{ 
                      width: '100%', 
                      height: 'auto',
                      display: 'block',
                      maxHeight: '70vh',
                      objectFit: 'contain'
                    }}
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="20"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ padding: '20px', paddingTop: '10px' }}>
                <button className="btn btn-primary" onClick={handleCerrarDetalle} style={{ width: '100%' }}>
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

export default Evidencias;
