import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-process-tab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8 max-w-2xl mx-auto text-center">
      <div class="mb-6 inline-flex p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h2 class="text-2xl font-bold text-slate-900 mb-2">Process Excel to CSV</h2>
      <p class="text-slate-500 mb-8">Convert the generated Excel file to a CSV format with updated scores (+10).</p>

      <div class="flex flex-col gap-6 items-center">
        <div class="w-full relative border-2 border-dashed border-slate-200 rounded-2xl p-8 hover:bg-slate-50 transition-all cursor-pointer group">
          <input type="file" (change)="onFileChange($event)" accept=".xlsx" class="absolute inset-0 opacity-0 cursor-pointer" />
          <div class="flex flex-col items-center">
            <span class="text-slate-400 group-hover:text-blue-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </span>
            <p class="mt-2 text-sm font-medium text-slate-600">{{ fileName || 'Select generated Excel file' }}</p>
          </div>
        </div>
        <button
          (click)="process.emit()"
          [disabled]="!hasFile || isLoading"
          class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
        >
          Start Conversion
        </button>
      </div>

      @if (message) {
        <div class="mt-6 p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-600 break-all">
          {{ message }}
          @if (canRetry) {
            <div class="mt-3">
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
export class ProcessTabComponent {
  @Input({ required: true }) hasFile!: boolean;
  @Input({ required: true }) isLoading!: boolean;
  @Input() fileName = '';
  @Input() message = '';
  @Input() canRetry = false;

  @Output() fileSelected = new EventEmitter<File | null>();
  @Output() process = new EventEmitter<void>();
  @Output() retry = new EventEmitter<void>();

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fileSelected.emit(input.files?.[0] ?? null);
  }
}
