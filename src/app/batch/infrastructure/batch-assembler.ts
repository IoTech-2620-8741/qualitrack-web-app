import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Batch, BatchStatus } from '../domain/model/batch.entity';
import { BatchTraceability } from '../domain/model/batch-traceability.entity';
import { BatchesResponse, BatchResource, BatchTraceabilityResource } from './batch-response';

/**
 * Maps product batches and their traceability between API resources and domain models.
 */
export class BatchAssembler implements BaseAssembler<Batch, BatchResource, BatchesResponse> {
  toEntitiesFromResponse(response: BatchesResponse): Batch[] {
    return response.batches.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: BatchResource): Batch {
    return new Batch({
      id: resource.id,
      labId: resource.labId,
      environmentId: resource.environmentId ?? null,
      productId: resource.productId,
      productName: resource.productName,
      batchNumber: resource.batchNumber,
      quantity: resource.quantity,
      unit: resource.unit,
      status: resource.status as BatchStatus,
      startDate: resource.startDate,
      endDate: resource.endDate ?? undefined,
      notes: resource.notes ?? undefined,
      containerMonitorId: resource.containerMonitorId,
    });
  }

  toResourceFromEntity(entity: Batch): BatchResource {
    return {
      id: entity.id,
      labId: entity.labId,
      environmentId: entity.environmentId,
      productId: entity.productId,
      productName: entity.productName,
      batchNumber: entity.batchNumber,
      quantity: entity.quantity,
      unit: entity.unit,
      status: entity.status,
      startDate: entity.startDate,
      endDate: entity.endDate,
      notes: entity.notes,
      containerMonitorId: entity.containerMonitorId,
    };
  }

  toTraceabilityFromResource(resource: BatchTraceabilityResource): BatchTraceability {
    return {
      batch: this.toEntityFromResource(resource.batch),
      product: resource.product,
      rawMaterials: resource.rawMaterials,
      equipment: resource.equipment,
      staff: resource.staff,
      release: resource.release,
      rejection: resource.rejection,
      container: resource.container ?? null,
    };
  }
}
