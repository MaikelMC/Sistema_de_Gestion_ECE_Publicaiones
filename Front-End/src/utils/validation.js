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
    if (fields.telefono && !validators.isNumeric(fields.telefono)) {
      errors.telefono = 'El teléfono solo debe contener números, espacios o símbolos +()-.';
    }
  }

  // soportar variantes en inglés/otros componentes
  if ('phone_number' in fields) {
    if (fields.phone_number && !validators.isNumeric(fields.phone_number)) {
      errors.phone_number = 'El teléfono solo debe contener números, espacios o símbolos +()-.';
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
