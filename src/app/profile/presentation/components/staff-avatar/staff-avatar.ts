import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';

import { ProfileStore } from '../../../application/profile.store';

/**
 * Round photo of a staff member, or their initials when there is none, so people are recognized at a glance.
 *
 * @remarks
 * With `load`, it downloads the photo through {@link ProfileStore.staffPhoto}, which keeps it for the session, so a
 * list only asks once per person. A page that already holds the photo passes it in `photoUrl` instead. The image is
 * decorative: the name is always written next to it.
 *
 * @example
 * ```html
 * <app-staff-avatar [laboratoryId]="7" [staffId]="member.id" [name]="member.fullName" [load]="canSeePhotos()" />
 * ```
 */
@Component({
  selector: 'app-staff-avatar',
  standalone: true,
  template: `
    <span class="avatar" [style.--avatar-size.px]="size()">
      @if (photo(); as url) {
        <img [src]="url" alt="" />
      } @else {
        <span aria-hidden="true">{{ initials() }}</span>
      }
    </span>
  `,
  styleUrl: './staff-avatar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffAvatar {
  /** Laboratory of the staff member. */
  readonly laboratoryId = input<number | null>(null);

  /** Staff member whose photo is shown. */
  readonly staffId = input<number | null>(null);

  /** Full name, whose initials stand in for the photo. */
  readonly name = input.required<string>();

  /** Whether to download the photo; only the quality manager may read the profiles of the staff. */
  readonly load = input(false);

  /** Photo the page already holds; it takes the place of the download. */
  readonly photoUrl = input<string | null>(null);

  /** Diameter in pixels. */
  readonly size = input(36);

  private readonly profiles = inject(ProfileStore);

  /** Photo downloaded for this staff member. */
  private readonly downloaded = signal<string | null>(null);

  /** Photo shown: the one given, or else the one downloaded. */
  protected readonly photo = computed(() => this.photoUrl() ?? this.downloaded());

  /** First letters of the first two words of the name. */
  protected readonly initials = computed(() =>
    this.name()
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join(''),
  );

  constructor() {
    effect((onCleanup) => {
      const laboratoryId = this.laboratoryId();
      const staffId = this.staffId();
      this.downloaded.set(null);
      if (!this.load() || this.photoUrl() || laboratoryId === null || staffId === null) return;
      const subscription = this.profiles
        .staffPhoto(laboratoryId, staffId)
        .subscribe((url) => this.downloaded.set(url));
      onCleanup(() => subscription.unsubscribe());
    });
  }
}
