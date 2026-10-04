import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { DeviationTrend } from '../domain/model/deviation-trend.entity';
import { DeviationTrendResource, DeviationTrendsResponse } from './deviation-trend-response';
import { DeviationTrendAssembler } from './deviation-trend-assembler';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

export class DeviationTrendApiEndpoint extends BaseApiEndpoint<
  DeviationTrend,
  DeviationTrendResource,
  DeviationTrendsResponse,
  DeviationTrendAssembler
> {
  constructor(http: HttpClient) {
    super(http, laboratoriesEndpointUrl, new DeviationTrendAssembler());
  }

  getTrendsByEquipment(laboratoryId: number, equipmentId: number): Observable<DeviationTrend[]> {
    return this.http
      .get<
        DeviationTrendResource[]
      >(`${this.endpointUrl}/${laboratoryId}${environment.equipmentEndpointPath}/${equipmentId}${environment.equipmentDeviationTrendsEndpointPath}`)
      .pipe(
        map((resources) => this.assembler.toEntitiesFromResources(resources)),
        catchError(
          this.handleError(`Failed to fetch deviation trends for equipment ${equipmentId}`),
        ),
      );
  }
}
