import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Pharmaceutical product manufactured in an environment of the laboratory (US71).
 *
 * @remarks
 * Each manufacturing run of the product is a {@link Batch}. Products registered before environments
 * existed have a null environment and cannot be opened until they are assigned to one.
 */
export class PharmaceuticalProduct implements BaseEntity {
  id: number;
  laboratoryId: number;
  environmentId: number | null;
  code: string;
  name: string;
  description: string | null;
  specifications: string;
  active: boolean;

  constructor(params: {
    id: number;
    laboratoryId: number;
    environmentId: number | null;
    code: string;
    name: string;
    description: string | null;
    specifications: string;
    active: boolean;
  }) {
    this.id = params.id;
    this.laboratoryId = params.laboratoryId;
    this.environmentId = params.environmentId;
    this.code = params.code;
    this.name = params.name;
    this.description = params.description;
    this.specifications = params.specifications;
    this.active = params.active;
  }
}
