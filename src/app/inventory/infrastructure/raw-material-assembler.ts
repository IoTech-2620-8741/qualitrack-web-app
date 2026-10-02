import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { RawMaterial } from '../domain/model/raw-material.entity';
import { RawMaterialResource, RawMaterialsResponse } from './raw-material-response';

export class RawMaterialAssembler implements BaseAssembler<
  RawMaterial,
  RawMaterialResource,
  RawMaterialsResponse
> {
  toEntityFromResource(resource: RawMaterialResource): RawMaterial {
    return new RawMaterial({
      id: resource.id,
      laboratoryId: resource.laboratoryId,
      environmentId: resource.environmentId ?? null,
      code: resource.code,
      name: resource.name,
      unit: resource.unit,
      minimumStock: resource.minimumStock,
      usableStock: resource.usableStock,
      physicalStock: resource.physicalStock,
      stockStatus: resource.stockStatus,
      legacyId: resource.legacyId,
    });
  }
  toResourceFromEntity(entity: RawMaterial): RawMaterialResource {
    return {
      id: entity.id,
      laboratoryId: entity.laboratoryId,
      environmentId: entity.environmentId,
      code: entity.code,
      name: entity.name,
      unit: entity.unit,
      minimumStock: entity.minimumStock,
      usableStock: entity.usableStock,
      physicalStock: entity.physicalStock,
      stockStatus: entity.stockStatus,
      legacyId: entity.legacyId,
    };
  }
  toEntitiesFromResponse(response: RawMaterialsResponse): RawMaterial[] {
    return response.rawMaterials.map((resource) => this.toEntityFromResource(resource));
  }
}
