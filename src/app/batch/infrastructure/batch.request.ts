/** Body of POST .../products/{productId}/batches (TS63). */
export interface CreateBatchRequest {
  batchNumber: string;
  quantity: number;
  unit: string;
  startDate: string;
  notes?: string;
}

/** Body of POST .../batches/{batchId}/releases (TS71). */
export interface ReleaseBatchRequest {
  releaseDate: string;
  notes: string;
}

/** Body of POST .../batches/{batchId}/rejections (TS72). */
export interface RejectBatchRequest {
  rejectionDate: string;
  reason: string;
}

/** Body of POST .../batches/{batchId}/equipment-usages (TS66). */
export interface RegisterEquipmentUsageRequest {
  equipmentId: number;
}

/** Body of PUT .../batches/{batchId}/container-assignment (TS68). */
export interface AssignBatchContainerRequest {
  containerMonitorId: number;
}

/** Body of POST .../batches/{batchId}/staff-participations (TS67). */
export interface RegisterStaffParticipationRequest {
  staffId: number;
}
