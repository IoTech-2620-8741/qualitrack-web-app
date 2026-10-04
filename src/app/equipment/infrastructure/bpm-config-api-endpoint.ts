import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { BpmParameterConfig } from '../domain/model/bpm-parameter-config.entity';
import { BpmConfigResource, BpmConfigsResponse } from './bpm-config-response';
import { BpmConfigAssembler } from './bpm-config-assembler';
import { ConfigureBpmRequest } from './bpm-config.request';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * BPM parameter ranges of an equipment: /laboratories/{laboratoryId}/equipments/{equipmentId}/bpm-configs. Each
 * parameter is identified by its name, so configuring it again replaces its range.
 */
export class BpmConfigApiEndpoint extends BaseApiEndpoint<
  BpmParameterConfig,
  BpmConfigResource,
  BpmConfigsResponse,
  BpmConfigAssembler
> {
  constructor(http: HttpClient) {
    super(http, laboratoriesEndpointUrl, new BpmConfigAssembler());
  }

  getConfigByEquipment(laboratoryId: number, equipmentId: number): Observable<BpmParameterConfig[]> {
    return this.http
      .get<BpmConfigResource[]>(this.configsUrl(laboratoryId, equipmentId))
      .pipe(
        map((resources) =>
          resources.map((resource) => this.assembler.toEntityFromResource(resource)),
        ),
        catchError(this.handleError(`Failed to fetch BPM config for equipment ${equipmentId}`)),
      );
  }

  configureBpm(laboratoryId: number, request: ConfigureBpmRequest): Observable<BpmParameterConfig> {
    const { equipmentId, parameterName, ...range } = request;
    return this.http
      .put<BpmConfigResource>(`${this.configsUrl(laboratoryId, equipmentId)}/${encodeURIComponent(parameterName)}`, range)
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError(this.handleError('Failed to configure BPM parameters')),
      );
  }

  private configsUrl(laboratoryId: number, equipmentId: number): string {
    return `${this.endpointUrl}/${laboratoryId}${environment.equipmentEndpointPath}/${equipmentId}`
      + environment.equipmentBpmConfigEndpointPath;
  }
}
