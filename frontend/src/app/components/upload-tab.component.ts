import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-upload-tab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8 max-w-2xl mx-auto text-center">
      <div class="mb-6 inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      </div>
      <h2 class="text-2xl font-bold text-slate-900 mb-2">Upload to Database</h2>
      <p class="text-slate-500 mb-8">Save the processed CSV data into PostgreSQL with adjusted scores (+5 from Excel).</p>

      <div class="flex flex-col gap-6 items-center">
        <div class="w-full relative border-2 border-dashed border-slate-200 rounded-2xl p-8 hover:bg-slate-50 transition-all cursor-pointer group">
          <input type="file" (change)="onFileChange($event)" accept=".csv" class="absolute inset-0 opacity-0 cursor-pointer" />
          <div class="flex flex-col items-center">
            <span class="text-slate-400 group-hover:text-indigo-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            <p class="mt-2 text-sm font-medium text-slate-600">{{ fileName || 'Select processed CSV file' }}</p>
          </div>
        </div>
        <button
          (click)="upload.emit()"
          [disabled]="!hasFile || isLoading"
          class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
        >
         Upload
        </button>
      </div>

      @if (message) {
        <div class="mt-6 p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-600">
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
export class UploadTabComponent {
  @Input({ required: true }) hasFile!: boolean;
  @Input({ required: true }) isLoading!: boolean;
  @Input() fileName = '';
  @Input() message = '';
  @Input() canRetry = false;

  @Output() fileSelected = new EventEmitter<File | null>();
  @Output() upload = new EventEmitter<void>();
  @Output() retry = new EventEmitter<void>();

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fileSelected.emit(input.files?.[0] ?? null);
  }
}
