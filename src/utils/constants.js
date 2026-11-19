// src/utils/constants.js - Constantes del negocio, matriz de clasificación y paleta de jabas
import { Snowflake, Store, Building2 } from 'lucide-react';

// ==========================================
// Matriz de clasificación permitida por variedad
// ==========================================
export const MATRIZ_CLASIFICACION = {
  Fuerte: ['1era', '2da', '3era', '4ta', 'Semimanchada', 'Manchada'],
  Hass: ['1era', '2da', '3era', '4ta', 'Manchada'],
  Naval: ['Limpia', 'Manchada'],
  Villacampa: ['1era', 'Manchada'],
};

// ==========================================
// Lista de variedades de palta admitidas
// ==========================================
export const TIPOS_PALTA = Object.keys(MATRIZ_CLASIFICACION);

// ==========================================
// Paleta de colores estándar para jabas físicas
// ==========================================
export const PALETA_COLORES_JABA = [
  { nombre: 'Verde Campo', hex: '#10B981' },
  { nombre: 'Azul Real', hex: '#2563EB' },
  { nombre: 'Rojo Escarlata', hex: '#EF4444' },
  { nombre: 'Amarillo Cítrico', hex: '#F59E0B' },
  { nombre: 'Naranja Cosecha', hex: '#F97316' },
  { nombre: 'Negro Azabache', hex: '#1F2937' },
  { nombre: 'Blanco Puro', hex: '#F3F4F6' },
  { nombre: 'Morado Uva', hex: '#8B5CF6' },
  { nombre: 'Turquesa', hex: '#06B6D4' },
];

// ==========================================
// Ubicaciones físicas por defecto en Lima
// ==========================================
export const UBICACIONES = [
  'Camara Frio',
  'Puesto Principal',
  'Puesto Contingencia',
];

// ==========================================
// Iconos asociados a cada tipo de ubicación
// ==========================================
export const UBICACION_ICONS = {
  'Camara Frio': Snowflake,
  'Puesto Principal': Store,
  'Puesto Contingencia': Building2,
};
