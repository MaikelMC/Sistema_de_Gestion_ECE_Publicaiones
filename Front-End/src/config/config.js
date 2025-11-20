// Configuración general de la aplicación
export const config = {
  API_URL: 'http://127.0.0.1:8000',
  API_BASE_URL: 'http://127.0.0.1:8000/api',
  FRONTEND_URL: 'http://localhost:5173',
  
  // Endpoints
  endpoints: {
    // Auth
    LOGIN: '/auth/login/',
    REGISTER: '/auth/register/',
    LOGOUT: '/auth/logout/',
    PROFILE: '/auth/profile/',
    CHANGE_PASSWORD: '/auth/change-password/',
    TOKEN: '/token/',
    TOKEN_REFRESH: '/token/refresh/',
    
    // Users
    USERS: '/auth/users/',
    USERS_ME: '/auth/users/me/',
    USERS_ESTUDIANTES: '/auth/users/estudiantes/',
    USERS_TUTORES: '/auth/users/tutores/',
    
    // Publications
    PUBLICATIONS: '/publications/',
    PUBLICATIONS_MY: '/publications/my_publications/',
    PUBLICATIONS_PENDING: '/publications/pending_review/',
    PUBLICATION_REVIEW: (id) => `/publications/${id}/review/`,
    PUBLICATION_SUBMIT: (id) => `/publications/${id}/submit_for_review/`,
    
    // Tutor Opinions
    TUTOR_OPINIONS: '/tutor-opinions/',
    TUTOR_OPINIONS_MY: '/tutor-opinions/my_opinions/',
    TUTOR_OPINIONS_PENDING: '/tutor-opinions/pending_publications/',
    
    // Tutor Students
    TUTOR_STUDENTS: '/tutor-students/',
    TUTOR_STUDENTS_MY: '/tutor-students/my_students/',
    TUTOR_STUDENTS_MY_TUTORS: '/tutor-students/my_tutors/',
    
    // ECE Requests
    ECE_REQUESTS: '/ece-requests/',
    ECE_REQUESTS_MY: '/ece-requests/my_requests/',
    ECE_REQUESTS_PENDING: '/ece-requests/pending_review/',
    ECE_REQUEST_REVIEW: (id) => `/ece-requests/${id}/review/`,
    ECE_REQUEST_SUBMIT: (id) => `/ece-requests/${id}/submit_for_review/`,
    
    // System
    SYSTEM_LOGS: '/system-logs/',
    SYSTEM_CONFIG: '/system-config/',
  }
};

export default config;
