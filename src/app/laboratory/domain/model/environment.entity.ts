import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { EnvironmentUsage } from './environment-usage';

/**
 * Represents a physical area of a laboratory or pharmaceutical warehouse.
 *
 * @remarks
 * In Domain-Driven Design, the Environment belongs to the Laboratory bounded context.
 * Other bounded contexts reference it to place raw materials, products, equipment
 * and IoT devices, and to organize environmental measurements.
 */
export class Environment implements BaseEntity {
  /**
   * The unique numeric identifier of the environment.
   */
  id: number;

  /**
   * The numeric identifier of the laboratory that owns the environment.
   */
  laboratoryId: number;

  /**
   * Identification of the environment, unique within its laboratory.
   */
  code: string;

  /**
   * Display name of the environment.
   */
  name: string;

  /**
   * Optional description of the environment.
   */
  description: string | null;

  /**
   * Main use of the environment, or null while it has not been assigned.
   */
  usage: EnvironmentUsage | null;

  /**
   * Identifier of the user that assigned the current usage.
   */
  usageAssignedBy: number | null;

  /**
   * ISO 8601 timestamp of the current usage assignment.
   */
  usageAssignedAt: string | null;

  /**
   * Creates a new Environment entity.
   *
   * @param params - Initialization properties
   */
  constructor(params: {
    id: number;
    laboratoryId: number;
    code: string;
    name: string;
    description: string | null;
    usage: EnvironmentUsage | null;
    usageAssignedBy: number | null;
    usageAssignedAt: string | null;
  }) {
    this.id = params.id;
    this.laboratoryId = params.laboratoryId;
    this.code = params.code;
    this.name = params.name;
    this.description = params.description;
    this.usage = params.usage;
    this.usageAssignedBy = params.usageAssignedBy;
    this.usageAssignedAt = params.usageAssignedAt;
  }

  /**
   * Indicates whether a usage has been assigned to the environment.
   */
  get hasUsage(): boolean {
    return this.usage !== null;
  }
}
