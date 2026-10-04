export interface GenerateBatchReportRequest {
  batchId: number;
  includeTelemetry: boolean;
  includeDeviations: boolean;
  format: 'PDF' | 'CSV';
}

export interface GenerateBatchReportBody {
  includeTelemetry: boolean;
  includeDeviations: boolean;
  format: 'PDF' | 'CSV';
}

export interface GenerateComplianceReportRequest {
  laboratoryId: number;
  startDate: string;
  endDate: string;
  format: 'PDF' | 'CSV';
}

export interface GenerateComplianceReportBody {
  startDate: string;
  endDate: string;
  format: 'PDF' | 'CSV';
}

export interface ExportEquipmentLogRequest {
  laboratoryId: number;
  environmentId: number;
  equipmentId: number;
  startDate: string;
  endDate: string;
  format: 'PDF' | 'CSV';
}

export interface ExportEquipmentLogBody {
  startDate: string;
  endDate: string;
  format: 'PDF' | 'CSV';
}
