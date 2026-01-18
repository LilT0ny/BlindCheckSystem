import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Paperclip, Pencil, User, CheckCircle, Clock } from 'lucide-react';
import Layout from '../../components/Layout';
import api from '../../services/api';

const DocenteDashboard = () => {
  const [materias, setMaterias] = useState([]);
  const [recalificaciones, setRecalificaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [materiasRes, recalificacionesRes] = await Promise.all([
        api.get('/docente/materias'),
        api.get('/docente/recalificaciones')
      ]);

      setMaterias(materiasRes.data);
      setRecalificaciones(recalificacionesRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Dashboard Docente">
        <div className="text-center mt-4">
          <span className="loading"></span>
          <p>Cargando...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard Docente">
      <div className="dashboard-grid">
        {/* Estadísticas */}
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-number">{materias.length}</div>
            <div className="stat-label">Materias Asignadas</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{recalificaciones.length}</div>
            <div className="stat-label">Recalificaciones Pendientes</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {recalificaciones.filter(r => r.calificaciones?.[0]?.ya_califico).length}
            </div>
            <div className="stat-label">Calificadas</div>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Acciones Rápidas</h2>
          </div>
          <div className="quick-actions">
            <Link to="/docente/materias" className="btn btn-primary">
              <BookOpen className="w-4 h-4" /> Mis Materias
            </Link>
            <Link to="/docente/evidencias" className="btn btn-secondary">
              <Paperclip className="w-4 h-4" /> Gestionar Evidencias
            </Link>
            <Link to="/docente/recalificaciones" className="btn btn-secondary">
              <Pencil className="w-4 h-4" /> Recalificaciones
            </Link>
            <Link to="/docente/perfil" className="btn btn-outline">
              <User className="w-4 h-4" /> Mi Perfil
            </Link>
          </div>
        </div>

        {/* Materias */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Mis Materias</h2>
          </div>
          <div className="grid grid-cols-2">
            {materias.length === 0 ? (
              <p className="text-center text-gray">No tienes materias asignadas</p>
            ) : (
              materias.map((materia) => (
                <div key={materia.id} className="card">
                  <h3>{materia.nombre}</h3>
                  <p className="text-gray">Código: <span className="font-mono">{materia.codigo}</span></p>
                  <p className="text-sm text-gray">Grupos: {materia.grupos.join(', ')}</p>
                  <p className="text-sm">Evidencias: {materia.evidencias_subidas}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recalificaciones pendientes */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recalificaciones Pendientes</h2>
          </div>
          <div className="solicitudes-list">
            {recalificaciones.length === 0 ? (
              <p className="text-center text-gray">No hay recalificaciones asignadas</p>
            ) : (
              recalificaciones.slice(0, 5).map((rec) => (
                <div key={rec.id} className="solicitud-item">
                  <div className="solicitud-info">
                    <h3>{rec.materia_nombre}</h3>
                    <p className="text-gray">
                      Estudiante: {rec.estudiante_nombre_anonimo}
                    </p>
                    <p className="text-sm text-gray">
                      Grupo: {rec.grupo} | Aporte: {rec.aporte}
                    </p>
                  </div>
                  <div className="solicitud-actions">
                    <span className={`badge ${rec.estado === 'calificada' ? 'badge-success' : 'badge-warning'}`}>
                      {rec.estado === 'calificada' ? 'Calificada' : rec.estado === 'aprobada' ? 'Aprobada' : 'En Revisión'}
                    </span>
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

export default DocenteDashboard;
