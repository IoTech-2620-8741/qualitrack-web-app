import { Location } from '@angular/common';
import { Component, inject, OnInit, input, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-page-not-found',
  standalone: true,
  imports: [RouterLink, TranslatePipe, MatButtonModule, MatIconModule],
  templateUrl: './page-not-found.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './page-not-found.css',
})
export class PageNotFound implements OnInit {
  protected invalidPath = '';

  readonly isSignedIn = input<boolean>(false);

  private readonly router = inject(Router);
  private readonly location = inject(Location);

  ngOnInit(): void {
    this.invalidPath = this.router.url || '/';
  }

  protected goBack(): void {
    this.location.back();
  }
}
