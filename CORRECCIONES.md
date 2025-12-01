En este documento se van a colocar todas las correcciones que deben hacerse en el proyecto

- Verificar que la página responda bien al error 404, 500 entre otros 
- Saber cómo se instancias las vistas 
- Al equivocarse en un formulario no recargar informar el error al momento que se está llenando em formulario no borrarlos y volverlos a pedir

Errores del Backend 
- El campo matrícula está mal no debería ir tiene que ser año que cursa -> ECHO ✅

- Condición de registro para la asignación de rol , cuando se registra un usuario no se diferencian los roles (estudiante/profesor) no pude ser manual -> ECHO ✅

- Datos del rol tutor siguen ficticios hay que ponerlos que salgan de la base de datos -> ECHO ✅

- Unificar un mismo Registro de Tutor y un Registro de Estudiante -> ECHO ✅

- Crear los grupos con sus respectivos permisos (estudiante, tutor , jefe de carrera y admin)

- Agregar un model al agregar publicación para que se cargue y luego liste las publicaciones -> ECHO ✅

- Eliminar el campo estension del perfil de tutor

- Revisar el panel de administracion 

- Revisar el panel de jefe de departamento

- No se encuentra implementado en cambiar contraseña 

- No se encuentra implementado el Olvidar contraseña

Restricción IP para accesos administrativos

Resumen: Limitar acceso al admin y endpoints críticos por lista blanca de IPs o ranges.
Pasos:
Añadir middleware que cheque request.META['REMOTE_ADDR'] o HTTP_X_FORWARDED_FOR y compare con ALLOW_ADMIN_IPS en settings.py.
Aplicar la comprobación solo en rutas de admin (/admin/) o vistas con @staff_member_required.
Alternativa infra: configurar firewall o reverse-proxy (NGINX) para restringir IPs — preferible en producción.
Estimación: 2–4 horas (middleware) o ajustar infra (depende).
Registro de auditoría centralizado y completo (SystemLog instrumentación)