// src/pages/JefeDepartamento/Reportes/Reportes.jsx
import './Reportes.css';
import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

function Reportes() {
  const [datosReporte, setDatosReporte] = useState({});
  const [periodo, setPeriodo] = useState('mensual');
  const [anio, setAnio] = useState('2025');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Cargar datos para los reportes
  useEffect(() => {
    cargarDatosReporte();
  }, [periodo, anio]);

  const cargarDatosReporte = async () => {
    try {
      setCargando(true);
      setError(null);
      
      // Obtener ID del jefe actual
      const meResponse = await api.get('/auth/users/me/');
      const jefeId = meResponse.data.id;
      
      // Llamadas paralelas a los endpoints
      const [statsResp, solicitudesResp, publicacionesResp, todasSolicitudesResp, solicitudesJefeResp] = await Promise.all([
        api.get('/auth/users/stats/'),
        api.get(`/requests/monthly_report/?year=${anio}`),
        api.get('/publications/by_level/'),
        api.get('/requests/'), // Todas las solicitudes (global)
        api.get(`/requests/?reviewed_by=${jefeId}`) // Solicitudes del jefe
      ]);
      
      const statsData = statsResp.data || {};
      const solicitudesMensuales = solicitudesResp.data || [];
      const publicacionesNivel = publicacionesResp.data || [];
      const todasSolicitudes = Array.isArray(todasSolicitudesResp.data) 
        ? todasSolicitudesResp.data 
        : todasSolicitudesResp.data.results || [];
      const solicitudesJefe = Array.isArray(solicitudesJefeResp.data) 
        ? solicitudesJefeResp.data 
        : solicitudesJefeResp.data.results || [];
      
      // Calcular tasa de aprobación GLOBAL (todas las solicitudes del sistema)
      const aprobadasGlobal = todasSolicitudes.filter(s => s.status === 'aprobada').length;
      const rechazadasGlobal = todasSolicitudes.filter(s => s.status === 'rechazada').length;
      const totalGlobal = aprobadasGlobal + rechazadasGlobal;
      const tasaAprobacionGlobal = totalGlobal > 0 ? Math.round((aprobadasGlobal / totalGlobal) * 100) : 0;
      
      // Calcular total de publicaciones
      const totalPublicacionesCalculado = Array.isArray(publicacionesNivel) 
        ? publicacionesNivel.reduce((sum, p) => sum + (p.cantidad || 0), 0) 
        : 0;
      
      // VERIFICACIÓN Y LOGGING DE DATOS ACTUALES
      console.log('📊 === VERIFICACIÓN DE DATOS EN REPORTES ===');
      console.log('✅ Total de Solicitudes (Global):', todasSolicitudes.length);
      console.log('   - Detalle:', {
        aprobadas: aprobadasGlobal,
        rechazadas: rechazadasGlobal,
        en_proceso: todasSolicitudes.filter(s => s.status === 'en_proceso').length
      });
      console.log('✅ Total de Publicaciones:', totalPublicacionesCalculado);
      console.log('   - Desglose por nivel:', publicacionesNivel);
      console.log('📋 Timestamp de carga:', new Date().toLocaleString('es-ES'));
      console.log('🔄 Periodo: Mensual | Año:', anio);
      
      // Construir objeto de datos
      setDatosReporte({
        resumen: {
          totalEstudiantes: statsData.por_rol?.estudiante || 0,
          totalSolicitudes: todasSolicitudes.length, // Total GLOBAL de solicitudes VERIFICADO
          totalPublicaciones: totalPublicacionesCalculado, // VERIFICADO
          tasaAprobacion: tasaAprobacionGlobal // Tasa GLOBAL calculada
        },
        solicitudesPorMes: Array.isArray(solicitudesMensuales) ? solicitudesMensuales : [],
        publicacionesPorNivel: Array.isArray(publicacionesNivel) ? publicacionesNivel : [],
        actividadesRecientes: []
      });
      
    } catch (err) {
      console.error('Error al cargar reportes:', err);
      console.error('Detalles del error:', err.response?.data);
      setError('No se pudieron cargar los datos del reporte');
      
      // Establecer datos vacíos en caso de error
      setDatosReporte({
        resumen: {
          totalEstudiantes: 0,
          totalSolicitudes: 0,
          totalPublicaciones: 0,
          tasaAprobacion: 0
        },
        solicitudesPorMes: [],
        publicacionesPorNivel: [],
        actividadesRecientes: []
      });
    } finally {
      setCargando(false);
    }
  };

  const getColorByTipo = (tipo) => {
    switch (tipo) {
      case 'solicitud': return '#3b82f6';
      case 'publicacion': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getIconByTipo = (tipo) => {
    switch (tipo) {
      case 'solicitud': return '📝';
      case 'publicacion': return '📄';
      default: return '📌';
    }
  };

  const { 
    resumen = {
      totalEstudiantes: 0,
      totalSolicitudes: 0,
      totalPublicaciones: 0,
      tasaAprobacion: 0
    }, 
    solicitudesPorMes = [], 
    publicacionesPorNivel = [], 
    actividadesRecientes = [] 
  } = datosReporte;

  // CALCULAR TOTAL CORRECTAMENTE
  const totalPublicaciones = publicacionesPorNivel.reduce((sum, item) => sum + (item.cantidad || 0), 0);

  // Calcular ángulos para el gráfico de pastel
  const calcularAngulos = () => {
    if (totalPublicaciones === 0) return [];
    
    let currentAngle = 0;
    return publicacionesPorNivel.map(item => {
      const percentage = (item.cantidad / totalPublicaciones) * 100;
      const angle = (percentage / 100) * 360;
      const segment = {
        ...item,
        percentage,
        startAngle: currentAngle,
        endAngle: currentAngle + angle
      };
      currentAngle += angle;
      return segment;
    });
  };

  const segmentos = calcularAngulos();

  if (error) {
    return (
      <div className="reportes-page">
        <header className="page-header">
          <h1>⚠️ Error al cargar reportes</h1>
          <p>{error}</p>
        </header>
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <button onClick={cargarDatosReporte} className="btn-primario">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="reportes-page">
        <div className="cargando">
          <div className="spinner"></div>
          <p>Cargando reportes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reportes-page">
      <header className="page-header">
        <div className="header-left">
          <h1>Reportes y Estadísticas</h1>
          <p>Métricas y análisis</p>
        </div>
      </header>

      {/* Resumen General */}
      <div className="resumen-cards">
        <div className="resumen-card">
          <div className="resumen-icon">📄</div>
          <div className="resumen-info">
            <span className="resumen-number">{resumen.totalPublicaciones}</span>
            <span className="resumen-label">Total de Publicaciones</span>
          </div>
        </div>
        <div className="resumen-card">
          <div className="resumen-icon">📝</div>
          <div className="resumen-info">
            <span className="resumen-number">{resumen.totalSolicitudes}</span>
            <span className="resumen-label">Total de Solicitudes</span>
          </div>
        </div>
      </div>

      {/* Gráficos y Métricas */}
      <div className="metricas-grid">
        {/* Publicaciones por Nivel - DISEÑO PREMIUM - */}
        <div className="metrica-card-premium">
          <h3>🎯 Publicaciones por Nivel</h3>
          <div className="publicaciones-por-nivel-optimizado">
            {publicacionesPorNivel.map((item, index) => (
              <div key={index} className="nivel-item-premium">
                <div className="nivel-header">
                  <div className="nivel-color" style={{ backgroundColor: item.color }}></div>
                  <span className="nivel-nombre">{item.nivel}</span>
                  <span className="nivel-cantidad">{item.cantidad}</span>
                </div>
                <div className="nivel-barra-wrapper">
                  <div 
                    className="nivel-barra"
                    style={{ 
                      backgroundColor: item.color,
                      width: `${totalPublicaciones > 0 ? (item.cantidad / totalPublicaciones) * 100 : 0}%`
                    }}
                  ></div>
                </div>
                <div className="nivel-porcentaje">{totalPublicaciones > 0 ? ((item.cantidad / totalPublicaciones) * 100).toFixed(1) : 0}%</div>
              </div>
            ))}
            <div className="nivel-total">
              <strong>Total: {totalPublicaciones} publicaciones</strong>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}

export default Reportes;