import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-generate-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-8 max-w-2xl mx-auto text-center">
      <div class="mb-6 inline-flex p-3 bg-blue-50 text-blue-600 rounded-2xl">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h2 class="text-2xl font-bold text-slate-900 mb-2">Generate Data</h2>
      <p class="text-slate-500 mb-8">Create a large dataset of random student records in Excel format.</p>

      <div class="flex flex-col gap-4 items-center">
        <div class="w-full text-left">
          <label class="block text-sm font-medium text-slate-700 mb-1">Number of Records</label>
          <input
            type="number"
            [ngModel]="recordCount"
            (ngModelChange)="recordCountChange.emit($event)"
            class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        <button
          (click)="generate.emit()"
          [disabled]="isLoading"
          class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
        >
          Generate {{ recordCount | number }} Records
        </button>
      </div>

      @if (message) {
        <div class="mt-6 p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-600 break-all">
          {{ message }}
          @if (canRetry) {
            <div class="mt-3">git
              <button
                (click)="retry.emit()"
                [disabled]="isLoading"
                class="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-md hover:bg-slate-100 disabled:opacity-50"
              >
                Retry
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GenerateTabComponent {
  @Input({ required: true }) recordCount!: number;
  @Input({ required: true }) isLoading!: boolean;
  @Input() message = '';
  @Input() canRetry = false;

  @Output() recordCountChange = new EventEmitter<number>();
  @Output() generate = new EventEmitter<void>();
  @Output() retry = new EventEmitter<void>();
}
