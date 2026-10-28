import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { environment } from '../../../environments/environment';
import { OverviewLaboratory } from '../domain/model/overview-laboratory.entity';
import { OverviewRawMaterial } from '../domain/model/overview-raw-material.entity';
import { OverviewBatch } from '../domain/model/overview-batch.entity';
import { OverviewEquipment } from '../domain/model/overview-equipment.entity';
import { OverviewAlert } from '../domain/model/overview-alert.entity';
import { OverviewReading } from '../domain/model/overview-reading.entity';
import { OverviewSubscription } from '../domain/model/overview-subscription.entity';
import { OverviewPlan } from '../domain/model/overview-plan.entity';
import { IndicatorPeriod } from '../domain/model/indicator-period';
import {
  OverviewAlertResource,
  OverviewBatchResource,
  OverviewEnvironmentResource,
  OverviewEquipmentResource,
  OverviewLaboratoryResource,
  OverviewMeasurementResource,
  OverviewPlanResource,
  OverviewRawMaterialResource,
  OverviewSubscriptionResource,
} from './operational-overview-response';
import { OperationalOverviewAssembler } from './operational-overview-assembler';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;
const plansEndpointUrl = `${environment.serverBasePath}${environment.subscriptionPlansEndpointPath}`;

/**
 * HTTP client of the operational overview (dashboard) of Reporting & Audit.
 *
 * @remarks
 * Reads the REST resources of the contexts that the overview summarizes and translates them with
 * {@link OperationalOverviewAssembler}, so Reporting & Audit does not depend on the code of those contexts:
 * - GET /laboratories/{laboratoryId} and /laboratories/{laboratoryId}/environments (Laboratory)
 * - GET .../environments/{environmentId}/raw-materials?stockStatus=LOW (Inventory)
 * - GET /laboratories/{laboratoryId}/batches (Product Batch)
 * - GET /laboratories/{laboratoryId}/equipments (Equipment)
 * - GET .../environments/{environmentId}/deviation-alerts?active=true (Compliance & Alerting)
 * - GET .../environments/{environmentId}[/container-monitors/{deviceId}]/telemetry-measurements (Tracking)
 * - GET /laboratories/{laboratoryId}/subscriptions?status=ACTIVE and /subscription-plans (Payments & Subscriptions)
 */
export class OperationalOverviewApiEndpoint extends ErrorHandlingEnabledBaseType {
  private readonly assembler = new OperationalOverviewAssembler();

  constructor(private readonly http: HttpClient) {
    super();
  }

  getLaboratory(laboratoryId: number): Observable<OverviewLaboratory> {
    return this.http.get<OverviewLaboratoryResource>(this.laboratory(laboratoryId)).pipe(
      map((resource) => this.assembler.toLaboratory(resource)),
      catchError(this.handleError(`Failed to fetch laboratory ${laboratoryId}`)),
    );
  }

  getEnvironmentIds(laboratoryId: number): Observable<number[]> {
    return this.http
      .get<OverviewEnvironmentResource[]>(`${this.laboratory(laboratoryId)}${environment.laboratoryEnvironmentsEndpointPath}`)
      .pipe(
        map((resources) => resources.map((resource) => resource.id)),
        catchError(this.handleError(`Failed to fetch environments of laboratory ${laboratoryId}`)),
      );
  }

  getLowStockMaterials(laboratoryId: number, environmentId: number): Observable<OverviewRawMaterial[]> {
    const params = new HttpParams().set('stockStatus', 'LOW');
    return this.http
      .get<OverviewRawMaterialResource[]>(
        `${this.environment(laboratoryId, environmentId)}${environment.inventoryRawMaterialsEndpointPath}`,
        { params },
      )
      .pipe(
        map((resources) => resources.map((resource) => this.assembler.toRawMaterial(resource))),
        catchError(this.handleError(`Failed to fetch raw materials of environment ${environmentId}`)),
      );
  }

  getBatches(laboratoryId: number): Observable<OverviewBatch[]> {
    return this.http
      .get<OverviewBatchResource[]>(`${this.laboratory(laboratoryId)}${environment.productBatchesEndpointPath}`)
      .pipe(
        map((resources) => resources.map((resource) => this.assembler.toBatch(resource))),
        catchError(this.handleError(`Failed to fetch batches of laboratory ${laboratoryId}`)),
      );
  }

  getEquipment(laboratoryId: number): Observable<OverviewEquipment[]> {
    return this.http
      .get<OverviewEquipmentResource[]>(`${this.laboratory(laboratoryId)}${environment.equipmentEndpointPath}`)
      .pipe(
        map((resources) => resources.map((resource) => this.assembler.toEquipment(resource))),
        catchError(this.handleError(`Failed to fetch equipment of laboratory ${laboratoryId}`)),
      );
  }

  getOpenAlerts(laboratoryId: number, environmentId: number): Observable<OverviewAlert[]> {
    const params = new HttpParams().set('active', true);
    return this.http
      .get<OverviewAlertResource[]>(
        `${this.environment(laboratoryId, environmentId)}${environment.deviationAlertsEndpointPath}`,
        { params },
      )
      .pipe(
        map((resources) => resources.map((resource) => this.assembler.toAlert(resource))),
        catchError(this.handleError(`Failed to fetch alerts of environment ${environmentId}`)),
      );
  }

  /**
   * Reads the measurements of an environment, or of one container monitor when its identifier is given.
   */
  getReadings(
    laboratoryId: number,
    environmentId: number,
    containerMonitorId: number | null,
    period: IndicatorPeriod,
  ): Observable<OverviewReading[]> {
    const target = containerMonitorId === null
      ? this.environment(laboratoryId, environmentId)
      : `${this.environment(laboratoryId, environmentId)}${environment.containerMonitorsEndpointPath}/${containerMonitorId}`;
    const params = new HttpParams().set('from', period.from).set('to', period.to);
    return this.http
      .get<OverviewMeasurementResource[]>(`${target}${environment.trackingTelemetryMeasurementsEndpointPath}`, { params })
      .pipe(
        map((resources) => resources.map((resource) => this.assembler.toReading(resource))),
        catchError(this.handleError(`Failed to fetch measurements of environment ${environmentId}`)),
      );
  }

  /**
   * Reads the active subscription of the laboratory.
   *
   * @returns The active subscription, or null when the laboratory has none
   */
  getActiveSubscription(laboratoryId: number): Observable<OverviewSubscription | null> {
    const params = new HttpParams().set('status', 'ACTIVE');
    return this.http
      .get<OverviewSubscriptionResource[]>(
        `${this.laboratory(laboratoryId)}${environment.laboratorySubscriptionsEndpointPath}`,
        { params },
      )
      .pipe(
        map((resources) => {
          const active = resources.find((resource) => resource.status === 'ACTIVE');
          return active ? this.assembler.toSubscription(active) : null;
        }),
        catchError(this.handleError(`Failed to fetch subscription of laboratory ${laboratoryId}`)),
      );
  }

  getPlans(): Observable<OverviewPlan[]> {
    return this.http.get<OverviewPlanResource[]>(plansEndpointUrl).pipe(
      map((resources) => resources.map((resource) => this.assembler.toPlan(resource))),
      catchError(this.handleError('Failed to fetch subscription plans')),
    );
  }

  private laboratory(laboratoryId: number): string {
    return `${laboratoriesEndpointUrl}/${laboratoryId}`;
  }

  private environment(laboratoryId: number, environmentId: number): string {
    return `${this.laboratory(laboratoryId)}${environment.laboratoryEnvironmentsEndpointPath}/${environmentId}`;
  }
}
