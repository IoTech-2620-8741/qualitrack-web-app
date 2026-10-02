import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { environment } from '../../../environments/environment';
import { LegacyMaterial } from '../domain/model/legacy-material.entity';
import { ImportRawMaterialRequest, LegacyMaterialResource } from './legacy-inventory-response';
import { RawMaterialResource } from './raw-material-response';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/** Read-only legacy snapshot and one-time transfer into an environment, not a second writable catalogue. */
export class LegacyInventoryApiEndpoint extends ErrorHandlingEnabledBaseType {
  constructor(private readonly http: HttpClient) {
    super();
  }
  pending(lab: number) {
    return this.http
      .get<LegacyMaterialResource[]>(
        `${laboratoriesEndpointUrl}/${lab}${environment.inventoryEndpointPath}${environment.inventoryLegacyMaterialsEndpointPath}`,
      )
      .pipe(
        map((resources) =>
          resources.map((resource): LegacyMaterial => ({
            id: resource.id,
            code: resource.code,
            name: resource.name,
            unit: resource.unit,
            balance: resource.balance,
            supplier: resource.supplier,
            batchNumber: resource.batchNumber,
            expiresOn: resource.expiresOn,
          })),
        ),
        catchError(this.handleError('Failed to load previous balances')),
      );
  }
  importMaterial(lab: number, environmentId: number, legacyId: number) {
    const request: ImportRawMaterialRequest = { legacyId };
    return this.http
      .post<RawMaterialResource>(
        `${laboratoriesEndpointUrl}/${lab}${environment.laboratoryEnvironmentsEndpointPath}/${environmentId}${environment.inventoryRawMaterialImportsEndpointPath}`,
        request,
      )
      .pipe(catchError(this.handleError('Failed to import previous balance')));
  }
}
