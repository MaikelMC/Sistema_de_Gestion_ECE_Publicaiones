export const validators = {
  isAlpha: (value) => {
    if (value == null) return false;
    return /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s'-]+$/.test(value.trim());
  },
  isNumeric: (value) => {
    if (value == null) return false;
    return /^[0-9+()\-\s]+$/.test(value.trim());
  },
  isEmail: (value) => {
    if (value == null) return false;
    // Accept only institutional emails: @uci.cu or @estudiantes.uci.cu
    // local part allows letters, numbers and common punctuation
    return /^[A-Za-z0-9._%+-]+@(uci\.cu|estudiantes\.uci\.cu)$/i.test(value.trim());
  },
  isUsername: (value) => {
    if (value == null) return false;
    // Allow letters, numbers, dot, underscore and hyphen, 3-30 chars
    return /^[A-Za-z0-9._-]{3,30}$/.test(value.trim());
  },
  minLength: (value, len) => {
    if (value == null) return false;
    return value.trim().length >= len;
  },
  maxLength: (value, len) => {
    if (value == null) return false;
    return value.trim().length <= len;
  }
};

export function validateProfile(fields) {
  // fields: object with keys e.g. {nombre, email, telefono}
  const errors = {};

  if ('nombre' in fields) {
    if (!fields.nombre || !validators.isAlpha(fields.nombre)) {
      errors.nombre = 'El nombre solo debe contener letras, espacios, guiones o apóstrofes.';
    }
  }

  if ('email' in fields) {
    if (!fields.email || !validators.isEmail(fields.email)) {
      errors.email = 'Correo no válido. Use una cuenta institucional @uci.cu o @estudiantes.uci.cu.';
    }
  }

  if ('telefono' in fields) {
    if (fields.telefono) {
      if (!validators.isNumeric(fields.telefono)) {
        errors.telefono = 'El teléfono solo debe contener números, espacios o símbolos +()-.';
      } else if (!validators.maxLength(fields.telefono, 8)) {
        errors.telefono = 'El teléfono no puede tener más de 8 caracteres.';
      }
    }
  }

  // soportar variantes en inglés/otros componentes
  if ('phone_number' in fields) {
    if (fields.phone_number) {
      if (!validators.isNumeric(fields.phone_number)) {
        errors.phone_number = 'El teléfono solo debe contener números, espacios o símbolos +()-.';
      } else if (!validators.maxLength(fields.phone_number, 8)) {
        errors.phone_number = 'El teléfono no puede tener más de 8 caracteres.';
      }
    }
  }

  if ('first_name' in fields) {
    if (fields.first_name && !validators.isAlpha(fields.first_name)) {
      errors.first_name = 'El nombre solo debe contener letras y espacios.';
    }
  }

  if ('last_name' in fields) {
    if (fields.last_name && !validators.isAlpha(fields.last_name)) {
      errors.last_name = 'El apellido solo debe contener letras y espacios.';
    }
  }

  if ('username' in fields) {
    if (fields.username && !validators.isUsername(fields.username)) {
      errors.username = 'El nombre de usuario debe tener 3-30 caracteres; solo letras, números, ., _ y -.';
    }
  }

  if ('carrera' in fields) {
    if (fields.carrera && !validators.isAlpha(fields.carrera)) {
      errors.carrera = 'La carrera solo debe contener letras y espacios.';
    }
  }

  if ('especialidad' in fields) {
    if (fields.especialidad && !validators.isAlpha(fields.especialidad)) {
      errors.especialidad = 'La especialidad solo debe contener letras y espacios.';
    }
  }

  return errors;
}
