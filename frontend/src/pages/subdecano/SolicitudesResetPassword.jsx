import React, { useState, useEffect } from 'react';
import { KeyRound, GraduationCap, Users, CheckCircle, XCircle, RefreshCw, ClipboardCopy, Info } from 'lucide-react';
import Layout from '../../components/Layout';
import AlertModal from '../../components/AlertModal';
import ConfirmModal from '../../components/ConfirmModal';
import api from '../../services/api';
import './GestionDocentes.css'; // Reutilizamos estilos

const SolicitudesResetPassword = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, type: 'info', title: '', message: '' });
  const [confirm, setConfirm] = useState({ show: false, title: '', message: '', action: null });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState(null);

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    try {
      const res = await api.get('/subdecano/solicitudes-reset-password');
      setSolicitudes(res.data);
    } catch (error) {
      console.error('Error:', error);
      setAlert({
        show: true,
        type: 'error',
        title: '❌ Error',
        message: 'Error al cargar solicitudes'
      });
    } finally {
      setLoading(false);
    }
  };

  const generarPassword = async (solicitudId) => {
    setConfirm({
      show: true,
      title: '🔄 Generar Contraseña Temporal',
      message: '¿Desea generar una contraseña temporal para este usuario?',
      action: async () => {
        try {
          const res = await api.post(`/subdecano/generar-password-reset/${solicitudId}`);

          setPasswordData({
            email: res.data.email,
            password: res.data.password_temporal,
            instrucciones: res.data.instrucciones
          });
          setShowPasswordModal(true);

          // Recargar lista
          setTimeout(() => cargarSolicitudes(), 1000);
        } catch (error) {
          console.error('Error:', error);
          setAlert({
            show: true,
            type: 'error',
            title: '❌ Error',
            message: 'Error al generar contraseña'
          });
        }
      }
    });
  };

  const copiarAlPortapapeles = () => {
    if (passwordData?.password) {
      navigator.clipboard.writeText(passwordData.password);
      setAlert({
        show: true,
        type: 'success',
        title: '✅ Copiado',
        message: 'Contraseña copiada al portapapeles'
      });
    }
  };

  if (loading) {
    return (
      <Layout title="Solicitudes de Reset de Contraseña">
        <div className="text-center mt-4"><span className="loading"></span></div>
      </Layout>
    );
  }

  return (
    <Layout title="Solicitudes de Reset de Contraseña">
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

      <div className="gestion-container">
        <div className="gestion-header">
          <h2><KeyRound className="inline-block mr-2" size={24} /> Solicitudes de Reset de Contraseña</h2>
          <div className="badge badge-info">
            {solicitudes.filter(s => s.estado === 'pendiente').length} Pendientes
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Fecha Solicitud</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                    <div className="flex items-center justify-center gap-2">
                      <Info size={20} /> No hay solicitudes de reset
                    </div>
                  </td>
                </tr>
              ) : (
                solicitudes.map(solicitud => (
                  <tr key={solicitud.id} style={{
                    backgroundColor: solicitud.estado === 'pendiente' ? '#fff3cd' : '#f0f0f0',
                    opacity: solicitud.estado === 'completado' ? 0.7 : 1
                  }}>
                    <td>{solicitud.email}</td>
                    <td>
                      <span className="badge badge-info">
                        {solicitud.rol === 'estudiante' && <Users size={16} className="inline mr-1" />}
                        {solicitud.rol === 'docente' && <GraduationCap size={16} className="inline mr-1" />}
                        {' '}
                        {solicitud.rol.charAt(0).toUpperCase() + solicitud.rol.slice(1)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${solicitud.estado === 'pendiente' ? 'badge-warning' :
                        solicitud.estado === 'completado' ? 'badge-success' :
                          'badge-danger'
                        }`}>
                        {solicitud.estado === 'pendiente' && '⏳ Pendiente'}
                        {solicitud.estado === 'completado' && <><CheckCircle size={14} className="inline mr-1" /> Completado</>}
                        {solicitud.estado === 'rechazado' && <><XCircle size={14} className="inline mr-1" /> Rechazado</>}
                      </span>
                    </td>
                    <td>
                      {new Date(solicitud.fecha_solicitud).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td>
                      {solicitud.estado === 'pendiente' ? (
                        <button
                          onClick={() => generarPassword(solicitud.id)}
                          className="btn btn-sm btn-primary"
                          title="Generar contraseña temporal"
                        >
                          <RefreshCw size={16} /> Generar
                        </button>
                      ) : (
                        <span style={{ color: '#999' }}>Completado</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal de Contraseña Temporal */}
        {showPasswordModal && passwordData && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '400px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              textAlign: 'center'
            }}>
              <h2 style={{ color: '#333', marginTop: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <CheckCircle size={24} className="text-success" /> Contraseña Generada
              </h2>

              <div style={{
                background: '#f0f7ff',
                padding: '15px',
                borderRadius: '8px',
                margin: '20px 0',
                border: '2px solid #2563eb'
              }}>
                <p style={{ fontSize: '12px', color: '#666', margin: '0 0 10px 0' }}>Email del usuario:</p>
                <p style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#333',
                  margin: 0
                }}>{passwordData.email}</p>
              </div>

              <div style={{
                background: '#fff3cd',
                padding: '15px',
                borderRadius: '8px',
                margin: '20px 0',
                border: '2px solid #ffc107',
                fontFamily: 'monospace'
              }}>
                <p style={{ fontSize: '12px', color: '#666', margin: '0 0 10px 0' }}>Contraseña Temporal:</p>
                <p style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#333',
                  margin: 0,
                  letterSpacing: '1px'
                }}>{passwordData.password}</p>
              </div>

              <div style={{
                background: '#e3f2fd',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#555',
                marginBottom: '20px',
                lineHeight: '1.6'
              }}>
                {passwordData.instrucciones}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={copiarAlPortapapeles}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  <ClipboardCopy size={18} /> Copiar
                </button>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SolicitudesResetPassword;
