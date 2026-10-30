import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { NotificationPreferencesForm } from '../../components/notification-preferences-form/notification-preferences-form';

/** Notification preferences owned by Compliance & Alerts and linked from the profile and toolbar bell. */
@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [TranslatePipe, NotificationPreferencesForm],
  templateUrl: './notification-settings.html',
  styleUrl: './notification-settings.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class NotificationSettings {}
