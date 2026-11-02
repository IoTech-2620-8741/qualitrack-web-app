import { Component, Inject, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';

/** Data injected into the preview dialog. */
export interface PreviewDialogData {
  blob: Blob;
  title: string;
}

/**
 * Modal dialog to display a preview of the generated PDF.
 *
 * @remarks
 * It takes a Blob from the API response, creates a secure URL, and renders
 * it inside a native iframe, allowing the user to read the document before downloading.
 */
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
  /** The sanitized URL of the PDF object. */
  protected pdfUrl: SafeResourceUrl | null = null;

  /**
   * Creates an instance of ReportPreviewDialog.
   *
   * @param data - The data injected by MatDialog (Blob and title)
   * @param dialogRef - Reference to the dialog to close it
   * @param sanitizer - Service to bypass security for the Blob URL
   */
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PreviewDialogData,
    private dialogRef: MatDialogRef<ReportPreviewDialog>,
    private sanitizer: DomSanitizer
  ) {}

  /** Generates the Blob URL and sanitizes it for iframe rendering. */
  ngOnInit() {
    const url = URL.createObjectURL(this.data.blob);
    this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  /** Closes the modal dialog. */
  protected close() {
    this.dialogRef.close();
  }
}
