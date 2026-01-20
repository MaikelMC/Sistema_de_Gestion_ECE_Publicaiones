// src/pages/JefeDepartamento/Reportes/Reportes.jsx
import './Reportes.css';
import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { toast } from 'react-toastify';

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
      
      // Construir objeto de datos
      setDatosReporte({
        resumen: {
          totalEstudiantes: statsData.por_rol?.estudiante || 0,
          totalSolicitudes: todasSolicitudes.length, // Total GLOBAL de solicitudes
          totalPublicaciones: Array.isArray(publicacionesNivel) 
            ? publicacionesNivel.reduce((sum, p) => sum + (p.cantidad || 0), 0) 
            : 0,
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

  const exportarPDF = () => {
    toast.info(`📊 Generando reporte ${periodo} en PDF...`);
  };

  const exportarExcel = () => {
    toast.info(`📈 Exportando datos ${periodo} a Excel...`);
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
        <div className="header-actions">
          <button className="btn-exportar" onClick={exportarPDF}>
            📊 PDF
          </button>
          <button className="btn-exportar" onClick={exportarExcel}>
            📈 Excel
          </button>
        </div>
      </header>

      {/* Filtros */}
      <div className="filtros-section">
        <h2 className='titulito'>Busca por Periodo y Año</h2>
        <div className="filtros-group">
          <div className="filtro-group">
            <label>Período:</label>
            <select 
              value={periodo} 
              onChange={(e) => setPeriodo(e.target.value)}
              className="filtro-select"
            >
              <option value="mensual">Mensual</option>
              <option value="trimestral">Trimestral</option>
              <option value="anual">Anual</option>
            </select>
          </div>
          <div className="filtro-group">
            <label>Año:</label>
            <select 
              value={anio} 
              onChange={(e) => setAnio(e.target.value)}
              className="filtro-select"
            >
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resumen General */}
      <div className="resumen-cards">
        <div className="resumen-card">
          <div className="resumen-icon">🎓</div>
          <div className="resumen-info">
            <span className="resumen-number">{resumen.totalEstudiantes}</span>
            <span className="resumen-label">Estudiantes Activos</span>
          </div>
        </div>
        <div className="resumen-card">
          <div className="resumen-icon">📝</div>
          <div className="resumen-info">
            <span className="resumen-number">{resumen.totalSolicitudes}</span>
            <span className="resumen-label">Solicitudes ECE</span>
          </div>
        </div>
        <div className="resumen-card">
          <div className="resumen-icon">📄</div>
          <div className="resumen-info">
            <span className="resumen-number">{resumen.totalPublicaciones}</span>
            <span className="resumen-label">Publicaciones</span>
          </div>
        </div>
        <div className="resumen-card">
          <div className="resumen-icon">✅</div>
          <div className="resumen-info">
            <span className="resumen-number">{resumen.tasaAprobacion}%</span>
            <span className="resumen-label">Tasa de Aprobación</span>
          </div>
        </div>
      </div>

      {/* Gráficos y Métricas */}
      <div className="metricas-grid">
        {/* Gráfico de Solicitudes por Mes */}
        <div className="metrica-card">
          <h3>📅 Solicitudes por {periodo === 'anual' ? 'Año' : periodo === 'trimestral' ? 'Trimestre' : 'Mes'}</h3>
          <div className="grafico-barras">
            {solicitudesPorMes.map((item, index) => (
              <div key={index} className="barra-container">
                <div className="barra-info">
                  <span className="barra-mes">{item.mes}</span>
                  <span className="barra-total">{item.solicitudes} total</span>
                </div>
                <div className="barra-wrapper">
                  <div 
                    className="barra aprobadas"
                    style={{ width: `${(item.aprobadas / item.solicitudes) * 100}%` }}
                    title={`Aprobadas: ${item.aprobadas}`}
                  ></div>
                  <div 
                    className="barra rechazadas"
                    style={{ width: `${(item.rechazadas / item.solicitudes) * 100}%` }}
                    title={`Rechazadas: ${item.rechazadas}`}
                  ></div>
                </div>
                <div className="barra-leyenda">
                  <span>✅ {item.aprobadas}</span>
                  <span>❌ {item.rechazadas}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico de Publicaciones por Nivel - CORREGIDO */}
        <div className="metrica-card">
          <h3>🎯 Publicaciones por Nivel</h3>
          <div className="grafico-pastel">
            <div className="pastel-container">
              <div className="pastel-leyenda">
                {publicacionesPorNivel.map((item, index) => (
                  <div key={index} className="leyenda-item">
                    <div 
                      className="leyenda-color"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="leyenda-text">
                      {item.nivel}: {item.cantidad} ({((item.cantidad / totalPublicaciones) * 100).toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
              <div className="pastel-grafico">
                {segmentos.map((segmento, index) => (
                  <div
                    key={index}
                    className="pastel-segmento"
                    style={{
                      backgroundColor: segmento.color,
                      transform: `rotate(${segmento.startAngle}deg)`,
                      clipPath: `conic-gradient(from 0deg at 50% 50%, ${segmento.color} 0deg ${segmento.endAngle - segmento.startAngle}deg, transparent ${segmento.endAngle - segmento.startAngle}deg)`
                    }}
                  ></div>
                ))}
                <div className="pastel-centro">
                  <span className="pastel-total">{totalPublicaciones}</span>
                  <span>Total</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen de Métricas Avanzadas */}
      <div className="metricas-avanzadas">
        <h3>📊 Métricas Avanzadas - {periodo.charAt(0).toUpperCase() + periodo.slice(1)} {anio}</h3>
        <div className="avanzadas-grid">
          <div className="avanzada-card">
            <h4>📈 Resumen del Período</h4>
            <ul>
              <li>📊 Total de solicitudes procesadas: {resumen?.totalSolicitudes || 0}</li>
              <li>🎯 Publicaciones clasificadas: {resumen?.totalPublicaciones || 0}</li>
              <li>🎓 Estudiantes activos: {resumen?.totalEstudiantes || 0}</li>
            </ul>
          </div>
          <div className="avanzada-card">
            <h4>🎯 Indicadores de Calidad</h4>
            <ul>
              <li>✅ Tasa de aprobación: {resumen?.tasaAprobacion || 0}%</li>
              <li>📚 Publicaciones aprobadas por nivel disponibles</li>
              <li>📊 Datos del año {anio}</li>
            </ul>
          </div>
          <div className="avanzada-card">
            <h4>🔍 Sistema de Gestión</h4>
            <ul>
              <li>🎓 Sistema integrado con base de datos real</li>
              <li>📝 Reportes dinámicos por período</li>
              <li>📚 Clasificación automática por nivel</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reportes;