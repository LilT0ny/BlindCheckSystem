import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Pencil, Trash2 } from 'lucide-react';
import Layout from '../../components/Layout';
import AlertModal from '../../components/AlertModal';
import ConfirmModal from '../../components/ConfirmModal';
import api from '../../services/api';
import './GestionMaterias.css';

const GestionMaterias = () => {
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [alert, setAlert] = useState({ show: false, type: 'info', title: '', message: '' });
  const [confirm, setConfirm] = useState({ show: false, title: '', message: '', action: null, type: 'danger' });
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    descripcion: ''
  });

  useEffect(() => {
    cargarMaterias();
  }, []);

  const cargarMaterias = async () => {
    try {
      const response = await api.get('/subdecano/materias');
      setMaterias(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await api.put(`/subdecano/materias/${editando}`, formData);
        setAlert({ show: true, type: 'success', title: 'Éxito', message: 'Materia actualizada exitosamente' });
        setShowModal(false);
      } else {
        await api.post('/subdecano/materias', formData);
        setAlert({ show: true, type: 'success', title: 'Éxito', message: 'Materia creada exitosamente' });
        setShowModal(false);
      }
      resetForm();
      cargarMaterias();
    } catch (error) {
      console.error('Error:', error);
      setAlert({ show: true, type: 'error', title: 'Error', message: error.response?.data?.detail || 'Error al guardar materia' });
    }
  };

  const editar = (materia) => {
    setEditando(materia.id);
    setFormData({
      nombre: materia.nombre,
      codigo: materia.codigo,
      descripcion: materia.descripcion || ''
    });
    setShowModal(true);
  };

  const eliminar = async (id, nombre) => {
    setConfirm({
      show: true,
      title: 'Eliminar Materia',
      message: `¿Está seguro de que desea eliminar la materia "${nombre}"?`,
      type: 'danger',
      action: async () => {
        try {
          await api.delete(`/subdecano/materias/${id}`);
          setAlert({ show: true, type: 'success', title: 'Éxito', message: 'Materia eliminada exitosamente' });
          cargarMaterias();
        } catch (error) {
          console.error('Error:', error);
          setAlert({ show: true, type: 'error', title: 'Error', message: error.response?.data?.detail || 'Error al eliminar materia' });
        }
      }
    });
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      codigo: '',
      descripcion: ''
    });
    setEditando(null);
  };

  if (loading) {
    return (
      <Layout title="Gestión de Materias">
        <div className="text-center mt-4"><span className="loading"></span></div>
      </Layout>
    );
  }

  return (
    <Layout title="Gestión de Materias">
      <AlertModal
        show={alert.show}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ ...alert, show: false })}
      />
      <div className="gestion-container">
        <div className="gestion-header">
          <h2><BookOpen className="inline-block mr-2" size={24} /> Gestión de Materias</h2>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn btn-primary gap-2">
            <Plus size={20} /> Nueva Materia
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {materias.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                    No hay materias registradas
                  </td>
                </tr>
              ) : (
                materias.map(materia => (
                  <tr key={materia.id}>
                    <td><strong>{materia.codigo}</strong></td>
                    <td>{materia.nombre}</td>
                    <td>{materia.descripcion || 'Sin descripción'}</td>
                    <td style={{ textAlign: 'center', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => editar(materia)}
                      >
                        <Pencil size={16} /> Editar
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => eliminar(materia.id, materia.nombre)}
                      >
                        <Trash2 size={16} /> Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editando ? <><Pencil className="inline mr-2" size={20} /> Editar Materia</> : <><Plus className="inline mr-2" size={20} /> Nueva Materia</>}</h3>
              <button className="close-btn" onClick={() => { setShowModal(false); resetForm(); }}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Código de Materia *</label>
                <input
                  type="text"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleInputChange}
                  placeholder="ej: CS-301"
                  disabled={!!editando}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="ej: Estructuras de Datos"
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  placeholder="Descripción de la materia..."
                  rows="4"
                />
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">
                  {editando ? 'Actualizar' : 'Crear'} Materia
                </button>
                <button type="button" className="btn btn-outline" onClick={() => { setShowModal(false); resetForm(); }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirm.show && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          onConfirm={() => {
            confirm.action();
            setConfirm({ show: false, title: '', message: '', action: null, type: 'danger' });
          }}
          onCancel={() => setConfirm({ show: false, title: '', message: '', action: null, type: 'danger' })}
        />
      )}
    </Layout>
  );
};

export default GestionMaterias;
