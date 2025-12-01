import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import authService from './services/authService';
import Layout from "./components/Layout/Layout";
import JefeLayout from "./components/Layout/JefeLayout"; 
import Inicio from "./pages/Estudiante/Inicio/Inicio";
import Publicasiones from "./pages/Estudiante/Publicasiones/Publicaciones";
import Solicitud from "./pages/Estudiante/Solicitud/Solicitud";
import Perfil from "./pages/Estudiante/Perfil/Perfil";
import InicioJefe from "./pages/JefeDepartamento/Inicio/Inicio"; 
import GestionSolicitud from "./pages/JefeDepartamento/GestionSolicitud/GestionSolicitud"; 
import GestionPublicasiones from "./pages/JefeDepartamento/GestionPublicasiones/GestionPublicasiones"; 
import Reportes from "./pages/JefeDepartamento/Reportes/Reportes"; 
import PerfilJefe from "./pages/JefeDepartamento/PerfilJefe/PerfilJefe";
import TutorLayout from "./components/Layout/TutorLayout"; 
import InicioTutor from "./pages/Tutor/Inicio/Inicio";
import MisAlumnos from "./pages/Tutor/MisAlumnos/MisAlumnos"; 
import OpinionesTutor from "./pages/Tutor/OpinionesTutor/OpinionesTutor"; 
import PerfilTutor from "./pages/Tutor/PerfilTutor/PerfilTutor"; 

// ... otras importaciones existentes
import AdminLayout from "./components/Layout/AdminLayout";
import InicioAdmin from "./pages/Admin/InicioAdmin/InicioAdmin";
import GestionUsuarios from "./pages/Admin/GestionUsuarios/GestionUsuarios";
import LogsSistema from "./pages/Admin/LogsSistema/LogsSistema";
import Notificaciones from "./pages/Admin/Notificaciones/Notificaciones";
import Configuracion from "./pages/Admin/Configuracion/Configuracion"; // Corregido
import Footer from "./components/footer";

import Register from './components/Layout/Register';

import Login from "./pages/Estudiante/Login/Login";
import { useEffect, useState } from 'react';

// Componente para proteger rutas por rol
const ProtectedRoute = ({ children, requiredRole }) => {
  const [auth, setAuth] = useState({ isAuthenticated: null, userRole: null });

  useEffect(() => {
    const isAuthenticated = authService.isAuthenticated();
    const user = authService.getCurrentUser();
    const userRole = user?.role;
    setAuth({ isAuthenticated, userRole });
  }, []);

  // Mostrar loading mientras verifica
  if (auth.isAuthenticated === null) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '1.2rem'
      }}>
        🔄 Verificando autenticación...
      </div>
    );
  }

  return auth.isAuthenticated && auth.userRole === requiredRole ? children : <Navigate to="/login" replace />;
};

// Ruta pública que redirige si ya estás autenticado (según el rol)
const PublicRoute = ({ children }) => {
  const [auth, setAuth] = useState({ isAuthenticated: null, userRole: null });

  useEffect(() => {
    const isAuthenticated = authService.isAuthenticated();
    const user = authService.getCurrentUser();
    const userRole = user?.role;
    setAuth({ isAuthenticated, userRole });
  }, []);

  if (auth.isAuthenticated === null) {
    return <div>Cargando...</div>;
  }

  if (auth.isAuthenticated) {
  if (auth.userRole === 'estudiante') {
    return <Navigate to="/inicio" replace />;
  } else if (auth.userRole === 'jefe') {
    return <Navigate to="/jefe/inicio" replace />;
  } else if (auth.userRole === 'tutor') {
    return <Navigate to="/tutor/inicio" replace />;
  } else if (auth.userRole === 'admin') {
    return <Navigate to="/admin/inicio" replace />;
  }
}

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* RUTA PÚBLICA - LOGIN */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path='register' element={<Register/>}/>

        
        {/* RUTAS PARA ESTUDIANTE */}
        <Route path="/" element={
          <ProtectedRoute requiredRole="estudiante">
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/inicio" />} />
          <Route path="inicio" element={<Inicio />} />
          <Route path="publicaciones" element={<Publicasiones />} />
          <Route path="solicitud" element={<Solicitud />} />
          <Route path="perfil" element={<Perfil />} />
        </Route>

        {/* RUTAS PARA JEFE DE DEPARTAMENTO */}
        <Route path="/jefe" element={
          <ProtectedRoute requiredRole="jefe">
            <JefeLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/jefe/inicio" />} />
          <Route path="inicio" element={<InicioJefe />} />
          <Route path="gestion-solicitudes" element={<GestionSolicitud />} />
          <Route path="gestion-publicaciones" element={<GestionPublicasiones />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="perfil" element={<PerfilJefe />} />
        </Route>

        {/* RUTAS PARA TUTOR - NUEVO */}
        <Route path="/tutor" element={
          <ProtectedRoute requiredRole="tutor">
            <TutorLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/tutor/inicio" />} />
          <Route path="inicio" element={<InicioTutor />} />
          <Route path="mis-alumnos" element={<MisAlumnos />} />
          <Route path="opiniones" element={<OpinionesTutor />} />
          <Route path="perfil" element={<PerfilTutor />} />
        </Route>

        {/*RUTAS PARA EL ADMIN*/}
        <Route path='/admin' element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout/>
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/admin/inicio"/>}/>
          <Route path="inicio" element={<InicioAdmin />} />
          <Route path="usuarios" element={<GestionUsuarios />} />
          <Route path="notificaciones" element={<Notificaciones />} />
          <Route path="logs" element={<LogsSistema />} />
          <Route path="configuracion" element={<Configuracion />} />
        </Route>

        {/* RUTA POR DEFECTO */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </Router>
  );
}

export default App;