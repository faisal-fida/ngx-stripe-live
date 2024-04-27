import 'zone.js';

import {
  Component,
  importProvidersFrom,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';

import { StripeElementsOptions } from '@stripe/stripe-js';
import {
  injectStripe,
  provideNgxStripe,
  StripeElementsDirective,
  StripePaymentElementComponent,
} from 'ngx-stripe';

import { NgxStripeDialogComponent } from './core/dialog.component';
import {
  PlutoService,
  PLUTO_ID,
  STRIPE_PUBLIC_KEY,
} from './core/pluto.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatDividerModule,
    MatInputModule,
    MatToolbarModule,
    StripeElementsDirective,
    StripePaymentElementComponent,
  ],
  templateUrl: './main.html',
})
export class App implements OnInit {
  @ViewChild(StripePaymentElementComponent)
  paymentElement!: StripePaymentElementComponent;

  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly plutoService = inject(PlutoService);
  readonly stripe = injectStripe(STRIPE_PUBLIC_KEY);

  checkoutForm = this.fb.group({
    name: ['Ricardo', [Validators.required]],
    email: ['support@ngx-stripe.dev', [Validators.required]],
    city: ['Vigo', [Validators.required]],
    amount: [2500, [Validators.required, Validators.pattern(/\d+/)]],
  });

  elementsOptions: StripeElementsOptions = {
    locale: 'en',
    appearance: {
      theme: 'stripe',
      labels: 'floating',
      variables: {
        colorPrimary: '#673ab7',
      },
    },
  };

  paying = signal(false);

  get amount() {
    const amountValue = this.checkoutForm.get('amount')?.value;
    if (!amountValue || amountValue < 0) return 0;

    return Number(amountValue) / 100;
  }

  ngOnInit() {
    const amount = this.checkoutForm.get('amount')?.value;

    this.plutoService
      .createPaymentIntent({
        amount,
        currency: 'eur',
      })
      .subscribe((pi) => {
        this.elementsOptions.clientSecret = pi.client_secret as string;
      });
  }

  clear() {
    this.checkoutForm.patchValue({
      name: '',
      email: '',
      city: '',
    });
  }

  collectPayment() {
    if (this.paying() || this.checkoutForm.invalid) return;
    this.paying.set(true);

    const { name, email, city } = this.checkoutForm.getRawValue();

    this.stripe
      .confirmPayment({
        elements: this.paymentElement.elements,
        confirmParams: {
          payment_method_data: {
            billing_details: {
              name: name as string,
              email: email as string,
              address: {
                city: city as string,
              },
            },
          },
        },
        redirect: 'if_required',
      })
      .subscribe({
        next: (result) => {
          this.paying.set(false);
          if (result.error) {
            this.dialog.open(NgxStripeDialogComponent, {
              data: {
                type: 'error',
                message: result.error.message,
              },
            });
          } else if (result.paymentIntent.status === 'succeeded') {
            this.dialog.open(NgxStripeDialogComponent, {
              data: {
                type: 'success',
                message: 'Payment processed successfully',
              },
            });
          }
        },
        error: (err) => {
          this.paying.set(false);
          this.dialog.open(NgxStripeDialogComponent, {
            data: {
              type: 'error',
              message: err.message || 'Unknown Error',
            },
          });
        },
      });
  }
}

bootstrapApplication(App, {
  providers: [
    provideAnimationsAsync(),
    importProvidersFrom(ReactiveFormsModule),
    provideHttpClient(),
    provideNgxStripe(),
    {
      provide: PLUTO_ID,
      useValue: '449f8516-791a-49ab-a09d-50f79a0678b6',
    },
  ],
});
