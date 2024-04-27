import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  template: `
    <h1 mat-dialog-title>Ngx Stripe</h1>
    <div mat-dialog-content>
      {{ data.type | uppercase }}: {{ data.message }}
    </div>
    <div mat-dialog-actions>
      <button mat-button mat-dialog-close>OK</button>
    </div>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class NgxStripeDialogComponent {
  data =
    inject<{ type: 'error' | 'success'; message?: string }>(MAT_DIALOG_DATA);
}
