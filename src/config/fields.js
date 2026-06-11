// Mapeo ESTRICTO de campos: única fuente de verdad de qué se muestra y con qué etiqueta.
// Cualquier otro campo que venga de la API (country_id, parent_id, company_name,
// tipo_cliente, name_norm, email_norm, phone_norm, blocks, id...) NO se muestra.
// El orden de este array es el orden de visualización.

export const FIELDS = [
  { key: 'name', label: 'Nombre', type: 'text' },
  { key: 'complete_name', label: 'Nombre completo', type: 'text' },
  { key: 'type', label: 'Tipo', type: 'text' },
  { key: 'active', label: 'Activo', type: 'bool' },
  { key: 'street', label: 'Calle', type: 'text' },
  { key: 'street2', label: 'Calle 2', type: 'text' },
  { key: 'zip', label: 'Código postal', type: 'text' },
  { key: 'city', label: 'Ciudad', type: 'text' },
  { key: 'email', label: 'Correo electrónico', type: 'text' },
  { key: 'phone', label: 'Teléfono', type: 'text' },
  { key: 'mobile', label: 'Teléfono móvil', type: 'text' },
  { key: 'is_company', label: 'Compañía', type: 'bool' },
]

export const FIELD_KEYS = FIELDS.map((f) => f.key)
