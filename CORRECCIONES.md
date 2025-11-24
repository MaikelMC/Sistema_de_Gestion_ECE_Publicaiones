En este documento se van a colocar todas las correcciones que deben hacerse en el proyecto

- Verificar que la página responda bien al error 404, 500 entre otros 
- Saber cómo se instancias las vistas 
- Al equivocarse en un formulario no recargar informar el error al momento que se está llenando em formulario no borrarlos y volverlos a pedir

Errores del Backend 
- El campo matrícula está mal no debería ir tiene que ser año que cursa 
- Condición de registro para la asignación de rol , cuando se registra un usuario no se diferencian los roles (estudiante/profesor) no pude ser manual 
- Datos del rol tutor siguen ficticios hay que ponerlos que salgan de la base de datos 
- Separar login de usuario del login de tutor ya que no se piden los mismos datos 
- Crear los grupos con sus respectivos permisos (estudiante, tutor , jefe de carrera y admin)
- Agregar un model al agregar publicación para que se cargue y luego liste las publicaciones