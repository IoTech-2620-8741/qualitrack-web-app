import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { PharmaceuticalProduct } from '../domain/model/pharmaceutical-product.entity';
import { PharmaceuticalProductResource, PharmaceuticalProductsResponse } from './product-response';

/**
 * Maps pharmaceutical products between API resources and domain entities.
 */
export class ProductAssembler
  implements BaseAssembler<PharmaceuticalProduct, PharmaceuticalProductResource, PharmaceuticalProductsResponse>
{
  toEntitiesFromResponse(response: PharmaceuticalProductsResponse): PharmaceuticalProduct[] {
    return response.products.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: PharmaceuticalProductResource): PharmaceuticalProduct {
    return new PharmaceuticalProduct({
      id: resource.id,
      laboratoryId: resource.laboratoryId,
      environmentId: resource.environmentId ?? null,
      code: resource.code,
      name: resource.name,
      description: resource.description ?? null,
      specifications: resource.specifications,
      active: resource.active,
    });
  }

  toResourceFromEntity(entity: PharmaceuticalProduct): PharmaceuticalProductResource {
    return { ...entity };
  }
}
