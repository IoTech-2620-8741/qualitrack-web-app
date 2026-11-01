import {AuditAction, AuditLogEntry} from '../../domain/model/audit-log-entry.entity';

/** Columnas de la tabla de auditoría, en orden de presentación. */
export const AUDIT_LOG_COLUMNS = ['timestamp', 'action', 'entity', 'performedBy'] as const;
export type AuditLogColumn = (typeof AUDIT_LOG_COLUMNS)[number];

/** Clase CSS del badge según la acción de auditoría. */
export function actionBadgeClass(action: AuditAction): string {
  switch (action) {
    case 'CREATE':
    case 'REGISTER':
      return 'badge-create';
    case 'UPDATE':
      return 'badge-update';
    case 'DELETE':
      return 'badge-delete';
    case 'RELEASE':
    case 'ACKNOWLEDGE':
    case 'RESOLVE':
    case 'GENERATE':
    case 'EXPORT':
      return 'badge-success';
    case 'REJECT':
      return 'badge-danger';
    case 'UNKNOWN':
    default:
      return 'badge-default';
  }
}

/**
 * Indica si un identificador tecleado en el filtro no es un entero positivo.
 * null/vacío = filtro no usado → válido.
 */
export function isInvalidId(value: number | null | '' | undefined): boolean {
  if (value === null || value === undefined || (value as unknown) === '') return false;
  const n = Number(value);
  return !Number.isInteger(n) || n < 1;
}

/** Query que el store envía al backend. */
export interface AuditLogQuery {
  equipmentId?: number;
  batchId?: number;
  dateFrom?: string;
  dateTo?: string;
}

/** Construye el query a partir del estado del formulario, omitiendo vacíos. */
export function buildAuditLogQuery(filters: {
  equipmentId: number | null;
  batchId: number | null;
  dateFrom: Date | null;
  dateTo: Date | null;
}): AuditLogQuery | undefined {
  const query: AuditLogQuery = {};
  if (filters.equipmentId !== null) query.equipmentId = Number(filters.equipmentId);
  if (filters.batchId !== null) query.batchId = Number(filters.batchId);
  if (filters.dateFrom) query.dateFrom = filters.dateFrom.toISOString();
  if (filters.dateTo) query.dateTo = filters.dateTo.toISOString();
  return Object.keys(query).length > 0 ? query : undefined;
}

/** Estado vacío del formulario de filtros. */
export function emptyAuditLogFilters() {
  return {
    equipmentId: null as number | null,
    batchId: null as number | null,
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
  };
}

/** Filas con la entidad legible, sin lógica de presentación en el template. */
export interface AuditLogRow {
  entry: AuditLogEntry;
  badgeClass: string;
  dateLabel: string;
  timeLabel: string;
  entityType: string;
  entityId: number;
  performedBy: number;
  action: AuditAction;
  timestamp: string;
}

/**
 * Transforma los entries del store en filas listas para pintar.
 * El formateo de fecha se delega a `Intl` con locale explícito (inyectado por el caller).
 */
export function toAuditLogRows(
  entries: readonly AuditLogEntry[],
  locale: string,
): AuditLogRow[] {
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
  const timeFmt = new Intl.DateTimeFormat(locale, { timeStyle: 'medium' });
  return entries.map((entry) => {
    const date = new Date(entry.timestamp);
    return {
      entry,
      badgeClass: actionBadgeClass(entry.action),
      dateLabel: dateFmt.format(date),
      timeLabel: timeFmt.format(date),
      entityType: entry.entityType,
      entityId: entry.entityId,
      performedBy: entry.performedBy,
      action: entry.action,
      timestamp: entry.timestamp,
    };
  });
}
