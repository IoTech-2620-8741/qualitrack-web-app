import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { BaseApi } from '../../shared/infrastructure/base-api';
import { MessageResource } from '../../shared/infrastructure/message-response';

import { Laboratory } from '../domain/model/laboratory.entity';
import { StaffMember } from '../domain/model/staff-member.entity';
import { PharmaceuticalProduct } from '../domain/model/pharmaceutical-product.entity';
import { RawMaterial } from '../domain/model/raw-material.entity';
import { Environment } from '../domain/model/environment.entity';

import { LaboratoryApiEndpoint } from './laboratory-api-endpoint';
import { StaffApiEndpoint } from './staff-api-endpoint';
import { ProductApiEndpoint } from './product-api-endpoint';
import { RawMaterialApiEndpoint } from './raw-material-api-endpoint';
import { EnvironmentApiEndpoint } from './environment-api-endpoint';

import { CreateLaboratoryRequest, UpdateLaboratoryRequest } from './laboratory.request';
import { RegisterStaffRequest } from './staff.request';
import { CreateProductRequest } from './product.request';
import {
  AssignEnvironmentUsageRequest,
  CreateEnvironmentRequest,
  UpdateEnvironmentRequest,
} from './environment.request';
import { EnvironmentUsageAssignmentResource } from './environment-response';

/**
 * Infrastructure facade for Laboratory bounded context API operations.
 *
 * @remarks
 * This service centralizes all HTTP access for the Laboratory bounded context.
 * It delegates concrete HTTP operations to specialized endpoint clients while
 * exposing a clean API to the application layer.
 */
@Injectable({ providedIn: 'root' })
export class LaboratoryApi extends BaseApi {
  /**
   * Endpoint client for laboratory profile operations.
   */
  private readonly laboratoryEndpoint: LaboratoryApiEndpoint;

  /**
   * Endpoint client for laboratory staff operations.
   */
  private readonly staffEndpoint: StaffApiEndpoint;

  /**
   * Endpoint client for pharmaceutical product operations.
   */
  private readonly productsEndpoint: ProductApiEndpoint;

  /**
   * Endpoint client for raw material inventory operations.
   */
  private readonly materialsEndpoint: RawMaterialApiEndpoint;

  /**
   * Endpoint client for laboratory environment operations.
   */
  private readonly environmentsEndpoint: EnvironmentApiEndpoint;

  /**
   * Creates a new LaboratoryApi facade.
   *
   * @param http - Angular HttpClient used by the internal endpoint clients
   */
  constructor(http: HttpClient) {
    super();
    this.laboratoryEndpoint = new LaboratoryApiEndpoint(http);
    this.staffEndpoint = new StaffApiEndpoint(http);
    this.productsEndpoint = new ProductApiEndpoint(http);
    this.materialsEndpoint = new RawMaterialApiEndpoint(http);
    this.environmentsEndpoint = new EnvironmentApiEndpoint(http);
  }

  /**
   * Creates a new laboratory.
   *
   * @param request - Request payload containing laboratory registration data
   * @returns Observable stream emitting the created Laboratory entity
   */
  createLaboratory(request: CreateLaboratoryRequest): Observable<Laboratory> {
    return this.laboratoryEndpoint.createLaboratory(request);
  }

  /**
   * Retrieves a laboratory profile by its numeric identifier.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @returns Observable stream emitting a Laboratory domain entity
   */
  getLaboratory(laboratoryId: number): Observable<Laboratory> {
    return this.laboratoryEndpoint.getByLaboratoryId(laboratoryId);
  }

  /**
   * Updates mutable laboratory profile information.
   *
   * @param laboratoryId - Numeric identifier of the laboratory to update
   * @param request - Request payload containing updated laboratory data
   * @returns Observable stream emitting the updated Laboratory entity
   */
  updateLaboratory(laboratoryId: number, request: UpdateLaboratoryRequest): Observable<Laboratory> {
    return this.laboratoryEndpoint.updateLaboratory(laboratoryId, request);
  }

  /**
   * Retrieves all staff members associated with a laboratory.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @returns Observable stream emitting StaffMember domain entities
   */
  getStaff(laboratoryId: number): Observable<StaffMember[]> {
    return this.staffEndpoint.getStaffByLaboratoryId(laboratoryId);
  }

  /**
   * Registers a new staff member under a laboratory.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @param request - Request payload containing staff registration data
   * @returns Observable stream emitting a message response
   */
  registerStaff(laboratoryId: number, request: RegisterStaffRequest): Observable<MessageResource> {
    return this.staffEndpoint.registerStaff(laboratoryId, request);
  }

  /**
   * Deactivates an existing staff member.
   *
   * @param staffId - Numeric identifier of the staff member to deactivate
   * @returns Observable stream completing when the deactivation succeeds
   */
  deactivateStaff(staffId: number): Observable<void> {
    return this.staffEndpoint.deactivateStaff(staffId);
  }

  /**
   * Retrieves all pharmaceutical products registered under a laboratory.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @returns Observable stream emitting PharmaceuticalProduct domain entities
   */
  getProducts(laboratoryId: number): Observable<PharmaceuticalProduct[]> {
    return this.productsEndpoint.getProductsByLaboratoryId(laboratoryId);
  }

  /**
   * Creates a new pharmaceutical product under a laboratory.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @param request - Request payload containing product creation data
   * @returns Observable stream emitting a message response
   */
  createProduct(laboratoryId: number, request: CreateProductRequest): Observable<MessageResource> {
    return this.productsEndpoint.createProduct(laboratoryId, request);
  }

  /**
   * Retrieves all raw materials registered under a laboratory.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @returns Observable stream emitting RawMaterial domain entities
   */
  getRawMaterials(laboratoryId: number): Observable<RawMaterial[]> {
    return this.materialsEndpoint.getRawMaterialsByLaboratoryId(laboratoryId);
  }

  /**
   * Retrieves the environments registered in a laboratory.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @returns Observable stream emitting Environment domain entities
   */
  getEnvironments(laboratoryId: number): Observable<Environment[]> {
    return this.environmentsEndpoint.getEnvironments(laboratoryId);
  }

  /**
   * Retrieves one environment of a laboratory.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @param environmentId - Numeric identifier of the environment
   * @returns Observable stream emitting the Environment domain entity
   */
  getEnvironment(laboratoryId: number, environmentId: number): Observable<Environment> {
    return this.environmentsEndpoint.getEnvironment(laboratoryId, environmentId);
  }

  /**
   * Registers a new environment in a laboratory.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @param request - Request payload with the environment data
   * @returns Observable stream emitting the created Environment
   */
  createEnvironment(laboratoryId: number, request: CreateEnvironmentRequest): Observable<Environment> {
    return this.environmentsEndpoint.createEnvironment(laboratoryId, request);
  }

  /**
   * Replaces the identification data of an environment.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @param environmentId - Numeric identifier of the environment
   * @param request - Request payload with the new environment data
   * @returns Observable stream emitting the updated Environment
   */
  updateEnvironment(
    laboratoryId: number,
    environmentId: number,
    request: UpdateEnvironmentRequest,
  ): Observable<Environment> {
    return this.environmentsEndpoint.updateEnvironment(laboratoryId, environmentId, request);
  }

  /**
   * Assigns the main use of an environment.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @param environmentId - Numeric identifier of the environment
   * @param request - Request payload with the usage
   * @returns Observable stream emitting the usage assignment
   */
  assignEnvironmentUsage(
    laboratoryId: number,
    environmentId: number,
    request: AssignEnvironmentUsageRequest,
  ): Observable<EnvironmentUsageAssignmentResource> {
    return this.environmentsEndpoint.assignUsage(laboratoryId, environmentId, request);
  }
}
