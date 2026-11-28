import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { environment } from '../../../environments/environment';
import { StaffActivityEntry } from '../domain/model/staff-activity-entry.entity';
import { StaffActivityEntryResource } from './staff-activity-response';
import { StaffActivityAssembler } from './staff-activity-assembler';

const laboratoriesEndpointUrl = environment.serverBasePath + environment.laboratoryLabsEndpointPath;

/** Reads what a staff member did through the Reporting & Audit → Laboratory anti-corruption layer. */
export class StaffActivityApiEndpoint extends ErrorHandlingEnabledBaseType {
  private readonly assembler = new StaffActivityAssembler();

  constructor(private readonly http: HttpClient) {
    super();
  }

  /**
   * Reads GET /laboratories/{laboratoryId}/staff/{staffId}/audit-logs.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @param staffId - Numeric identifier of the staff member
   * @returns Observable emitting the entries performed by the staff member
   */
  getStaffActivity(laboratoryId: number, staffId: number): Observable<StaffActivityEntry[]> {
    const url = laboratoriesEndpointUrl + '/' + laboratoryId + environment.laboratoryStaffEndpointPath + '/' + staffId
      + environment.raAuditLogsEndpointPath;
    return this.http.get<StaffActivityEntryResource[]>(url).pipe(
      map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
      catchError(this.handleError(`Failed to fetch the activity of staff member ${staffId}`)),
    );
  }
}
