import { Component, Inject, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  MAT_DIALOG_DATA,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';

export interface PreviewDialogData {
  blob: Blob;
  title: string;
}

@Component({
  imports: [
    MatIcon,
    MatDialogContent,
    MatDialogTitle,
    MatIconButton,
    TranslatePipe
  ],
  selector: 'app-report-preview-dialog',
  styleUrl: './report-preview-dialog.css',
  templateUrl: './report-preview-dialog.html',
})
export class ReportPreviewDialog implements OnInit {
  protected pdfUrl: SafeResourceUrl | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PreviewDialogData,
    private dialogRef: MatDialogRef<ReportPreviewDialog>,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    const url = URL.createObjectURL(this.data.blob);
    this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  protected close() {
    this.dialogRef.close();
  }
}
