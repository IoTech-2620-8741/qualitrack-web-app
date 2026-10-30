import { OverviewLaboratory } from '../domain/model/overview-laboratory.entity';
import { OverviewEnvironment } from '../domain/model/overview-environment.entity';
import { OverviewRawMaterial } from '../domain/model/overview-raw-material.entity';
import { OverviewBatch } from '../domain/model/overview-batch.entity';
import { OverviewEquipment } from '../domain/model/overview-equipment.entity';
import { OverviewAlert } from '../domain/model/overview-alert.entity';
import { OverviewReading } from '../domain/model/overview-reading.entity';
import { OverviewSubscription } from '../domain/model/overview-subscription.entity';
import { OverviewPlan } from '../domain/model/overview-plan.entity';
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

/**
 * Anti-Corruption Layer of the operational overview: translates the resources of Laboratory, Inventory, Product
 * Batch, Equipment, Compliance & Alerting, Tracking & Telemetry and Payments & Subscriptions into the models of
 * Reporting & Audit.
 */
export class OperationalOverviewAssembler {
  toLaboratory(resource: OverviewLaboratoryResource): OverviewLaboratory {
    return new OverviewLaboratory({ id: resource.id, name: resource.name });
  }

  toEnvironment(resource: OverviewEnvironmentResource): OverviewEnvironment {
    return new OverviewEnvironment({
      id: resource.id,
      code: resource.code,
      name: resource.name,
      usage: resource.usage ?? null,
    });
  }

  toRawMaterial(resource: OverviewRawMaterialResource): OverviewRawMaterial {
    return new OverviewRawMaterial({ id: resource.id, name: resource.name, stockStatus: resource.stockStatus });
  }

  toBatch(resource: OverviewBatchResource): OverviewBatch {
    return new OverviewBatch({
      id: resource.id,
      batchNumber: resource.batchNumber,
      productName: resource.productName,
      status: resource.status,
      environmentId: resource.environmentId,
      productId: resource.productId,
    });
  }

  toEquipment(resource: OverviewEquipmentResource): OverviewEquipment {
    return new OverviewEquipment({
      id: resource.id,
      laboratoryId: resource.laboratoryId,
      environmentId: resource.environmentId,
      name: resource.name,
      deviceType: resource.deviceType,
    });
  }

  toAlert(resource: OverviewAlertResource): OverviewAlert {
    return new OverviewAlert({
      id: resource.id,
      equipmentId: resource.equipmentId,
      parameterName: resource.parameterName,
      recordedValue: resource.recordedValue,
      unit: resource.unit,
      severity: resource.severity,
      status: resource.status,
      timestamp: resource.timestamp,
    });
  }

  toReading(resource: OverviewMeasurementResource): OverviewReading {
    return new OverviewReading({
      deviceId: resource.deviceId,
      metric: resource.metric,
      value: resource.value,
      unit: resource.unit,
      measuredAt: resource.measuredAt,
    });
  }

  toSubscription(resource: OverviewSubscriptionResource): OverviewSubscription {
    return new OverviewSubscription({
      laboratoryId: resource.laboratoryId,
      planCode: resource.planCode,
      billingCycle: resource.billingCycle,
      status: resource.status,
      currentPeriodEnd: resource.currentPeriodEnd ?? null,
    });
  }

  toPlan(resource: OverviewPlanResource): OverviewPlan {
    return new OverviewPlan({
      code: resource.code,
      name: resource.name,
      billingPeriod: resource.billingCycle,
      priceAmount: resource.amount,
      currency: resource.currency,
      maxEquipment: resource.maxEquipment,
    });
  }
}
