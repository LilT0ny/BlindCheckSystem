import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import AlertModal from '../../components/AlertModal';
import ConfirmModal from '../../components/ConfirmModal';
import api from '../../services/api';
import './GestionDocentes.css'; // Reutilizamos los estilos

const GestionEstudiantes = () => {
  const [estudiantes, setEstudiantes] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: 'info', title: '', message: '' });
  const [confirm, setConfirm] = useState({ show: false, title: '', message: '', action: null, type: 'danger' });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordTemporal, setPasswordTemporal] = useState('');
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    carrera: 'Ingeniería de Software',
    materias_cursando: []
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [estudiantesRes, materiasRes] = await Promise.all([
        api.get('/subdecano/estudiantes'),
        api.get('/subdecano/materias')
      ]);
      setEstudiantes(estudiantesRes.data);
      setMaterias(materiasRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await api.put(`/subdecano/estudiantes/${editando}`, formData);
        setAlert({ show: true, type: 'success', title: '✅ Éxito', message: 'Estudiante actualizado exitosamente' });
        setShowModal(false);
      } else {
        const res = await api.post('/subdecano/estudiantes', formData);
        setPasswordTemporal(res.data.password_temporal);
        setShowPasswordModal(true);
        setShowModal(false);
      }
      resetForm();
      cargarDatos();
    } catch (error) {
      console.error('Error:', error);
      setAlert({ show: true, type: 'error', title: '❌ Error', message: error.response?.data?.detail || 'Error al guardar estudiante' });
    }
  };

  const editar = (estudiante) => {
    setEditando(estudiante.id);
    setFormData({
      email: estudiante.email,
      nombre: estudiante.nombre,
      carrera: estudiante.carrera,
      materias_cursando: estudiante.materias_cursando
    });
    setShowModal(true);
  };

  const eliminar = async (id) => {
    setConfirm({
      show: true,
      title: '⚠️ Desactivar Estudiante',
      message: '¿Está seguro de que desea desactivar este estudiante?',
      type: 'danger',
      action: async () => {
        try {
          await api.delete(`/subdecano/estudiantes/${id}`);
          setAlert({ show: true, type: 'success', title: '✅ Éxito', message: 'Estudiante desactivado exitosamente' });
          cargarDatos();
        } catch (error) {
          console.error('Error:', error);
          setAlert({ show: true, type: 'error', title: '❌ Error', message: 'Error al desactivar estudiante' });
        }
      }
    });
  };

  const resetForm = () => {
    setFormData({
      email: '',
      nombre: '',
      carrera: 'Ingeniería de Software',
      materias_cursando: []
    });
    setEditando(null);
  };

  const toggleMateria = (materiaId) => {
    if (formData.materias_cursando.includes(materiaId)) {
      setFormData({
        ...formData,
        materias_cursando: formData.materias_cursando.filter(m => m !== materiaId)
      });
    } else {
      setFormData({
        ...formData,
        materias_cursando: [...formData.materias_cursando, materiaId]
      });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(passwordTemporal);
    setAlert({ show: true, type: 'info', title: 'ℹ️ Copiar', message: 'Contraseña copiada al portapapeles' });
  };

  if (loading) {
    return (
      <Layout title="Gestión de Estudiantes">
        <div className="text-center mt-4"><span className="loading"></span></div>
      </Layout>
    );
  }

  return (
    <Layout title="Gestión de Estudiantes">
      <AlertModal 
        show={alert.show}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ ...alert, show: false })}
      />
      <div className="gestion-container">
        <div className="gestion-header">
          <h2>👨‍🎓 Gestión de Estudiantes</h2>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn btn-primary">
            ➕ Nuevo Estudiante
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Carrera</th>
                <th>Materias</th>
                <th>Estado</th>
                <th>Primer Login</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {estudiantes.map(est => (
                <tr key={est.id}>
                  <td>{est.id}</td>
                  <td>{est.nombre}</td>
                  <td>{est.email}</td>
                  <td>{est.carrera}</td>
                  <td>
                    <div className="materias-list">
                      {est.materias_cursando.map(matId => {
                        const mat = materias.find(m => m.id === matId);
                        return mat ? <span key={matId} className="materia-tag">{mat.codigo}</span> : null;
                      })}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${est.activo ? 'badge-success' : 'badge-danger'}`}>
                      {est.activo ? '✓ Activo' : '✗ Inactivo'}
                    </span>
                  </td>
                  <td>
                    {est.primer_login ? 
                      <span className="badge badge-warning">⚠️ Pendiente</span> : 
                      <span className="badge badge-success">✓ Completado</span>
                    }
                  </td>
                  <td>
                    <div className="acciones-btn-group">
                      <button onClick={() => editar(est)} className="btn btn-sm btn-secondary">✏️</button>
                      <button onClick={() => eliminar(est.id)} className="btn btn-sm btn-error">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal de Formulario */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editando ? '✏️ Editar Estudiante' : '➕ Nuevo Estudiante'}</h3>
                <button className="btn-close" onClick={() => setShowModal(false)}>✖</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    required
                    disabled={editando}
                  />
                </div>

                <div className="form-group">
                  <label>Nombre Completo *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.nombre}
                    onChange={e => setFormData({...formData, nombre: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Carrera *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.carrera}
                    onChange={e => setFormData({...formData, carrera: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Materias Cursando</label>
                  <div className="materias-checkbox-group">
                    {materias.map(materia => (
                      <label key={materia.id} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.materias_cursando.includes(materia.id)}
                          onChange={() => toggleMateria(materia.id)}
                        />
                        <span>{materia.codigo} - {materia.nombre}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editando ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Contraseña Temporal */}
        {showPasswordModal && (
          <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
            <div className="modal-content password-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>🔑 Credenciales Generadas</h3>
                <button className="btn-close" onClick={() => setShowPasswordModal(false)}>✖</button>
              </div>
              <div className="password-info">
                <p className="warning-text">
                  ⚠️ <strong>IMPORTANTE:</strong> Guarda estas credenciales. No podrás verlas nuevamente.
                </p>
                <div className="credential-box">
                  <label>Email:</label>
                  <div className="credential-value">{formData.email}</div>
                </div>
                <div className="credential-box">
                  <label>Contraseña Temporal:</label>
                  <div className="credential-value password-value">
                    {passwordTemporal}
                    <button 
                      type="button" 
                      className="btn btn-sm btn-copy"
                      onClick={copyToClipboard}
                    >
                      📋 Copiar
                    </button>
                  </div>
                </div>
                <p className="info-text">
                  El estudiante deberá cambiar su contraseña en el primer inicio de sesión.
                </p>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={() => setShowPasswordModal(false)}>
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}

        <AlertModal 
          show={alert.show}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert({ ...alert, show: false })}
        />

        <ConfirmModal
          show={confirm.show}
          type={confirm.type}
          title={confirm.title}
          message={confirm.message}
          onConfirm={() => {
            if (confirm.action) confirm.action();
            setConfirm({ ...confirm, show: false });
          }}
          onCancel={() => setConfirm({ ...confirm, show: false })}
        />
      </div>
    </Layout>
  );
};

export default GestionEstudiantes;
