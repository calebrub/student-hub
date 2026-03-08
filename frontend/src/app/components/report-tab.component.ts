import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Student } from '../student.service';

export type ExportFormat = 'excel' | 'csv' | 'pdf';

@Component({
  selector: 'app-report-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-wrap gap-4 items-center justify-between">
      <div class="flex gap-4 items-center flex-1 min-w-[300px]">
        <div class="relative flex-1">
          <span class="absolute left-3 top-2.5 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="number"
            placeholder="Search by Student ID..."
            [ngModel]="searchId"
            (ngModelChange)="onSearchIdChange($event)"
            class="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>
        <select
          [ngModel]="filterClass"
          (ngModelChange)="filterClassChange.emit($event)"
          class="px-4 py-2 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        >
          <option value="">All Classes</option>
          @for (c of classes; track c) {
            <option [value]="c">{{ c }}</option>
          }
        </select>
      </div>
      <div class="flex gap-2 items-center">
        <div class="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg">
          <label for="per-page" class="text-xs font-semibold text-slate-500">Per page</label>
          <select
            id="per-page"
            [ngModel]="size"
            (ngModelChange)="sizeChange.emit($event)"
            [disabled]="isTableLoading"
            class="text-xs font-semibold bg-transparent outline-none text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option [value]="10">10</option>
            <option [value]="25">25</option>
            <option [value]="50">50</option>
            <option [value]="100">100</option>
            <option [value]="1000">1000</option>
          </select>
        </div>
        <button
          (click)="onExport('excel')"
          [disabled]="isExporting"
          class="px-4 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          @if (exportingFormat === 'excel') {
            <span class="w-4 h-4 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></span>
          } @else {
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0L8 8m4-4v12"/></svg>
          }
          {{ exportingFormat === 'excel' ? 'Exporting...' : 'Excel' }}
        </button>
        <button
          (click)="onExport('csv')"
          [disabled]="isExporting"
          class="px-4 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          @if (exportingFormat === 'csv') {
            <span class="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></span>
          } @else {
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0L8 8m4-4v12"/></svg>
          }
          {{ exportingFormat === 'csv' ? 'Exporting...' : 'CSV' }}
        </button>
        <button
          (click)="onExport('pdf')"
          [disabled]="isExporting"
          class="px-4 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          @if (exportingFormat === 'pdf') {
            <span class="w-4 h-4 border-2 border-rose-200 border-t-rose-600 rounded-full animate-spin"></span>
          } @else {
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0L8 8m4-4v12"/></svg>
          }
          {{ exportingFormat === 'pdf' ? 'Exporting...' : 'PDF' }}
        </button>
      </div>
    </div>

    <div class="overflow-x-auto">
      @if (message) {
        <div class="mx-6 mt-6 mb-2 p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-sm">
          {{ message }}
          @if (canRetry) {
            <div class="mt-3">
              <button
                (click)="retry.emit()"
                [disabled]="isTableLoading || isExporting"
                class="px-3 py-1.5 text-xs font-semibold bg-white border border-rose-300 rounded-md hover:bg-rose-100 disabled:opacity-50"
              >
                {{ retryLabel }}
              </button>
            </div>
          }
        </div>
      }
      <table class="w-full text-left border-collapse">
        <thead class="bg-slate-50/80 text-slate-500 font-semibold text-xs uppercase tracking-wider">
          <tr>
            <th class="px-6 py-4 border-b border-slate-100">Student ID</th>
            <th class="px-6 py-4 border-b border-slate-100">First Name</th>
            <th class="px-6 py-4 border-b border-slate-100">Last Name</th>
            <th class="px-6 py-4 border-b border-slate-100">Date of Birth</th>
            <th class="px-6 py-4 border-b border-slate-100">Age</th>
            <th class="px-6 py-4 border-b border-slate-100">Class</th>
            <th class="px-6 py-4 border-b border-slate-100">Score</th>
          </tr>
        </thead>
        <tbody class="text-sm divide-y divide-slate-100">
          @if (isTableLoading) {
            <tr>
              <td colspan="7" class="px-6 py-12 text-center text-slate-400">
                <span class="inline-flex items-center gap-2">
                  <span class="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></span>
                  Loading student records...
                </span>
              </td>
            </tr>
          } @else {
            @for (s of students; track s.studentId) {
              <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="px-6 py-4 font-medium text-slate-900">{{ s.studentId }}</td>
                <td class="px-6 py-4">{{ s.firstName }}</td>
                <td class="px-6 py-4">{{ s.lastName }}</td>
                <td class="px-6 py-4 text-slate-500">{{ s.dob | date:'MMM d, y' }}</td>
                <td class="px-6 py-4 text-slate-500">{{ getAge(s.dob) }}</td>
                <td class="px-6 py-4">
                  <span class="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">{{ s.studentClass }}</span>
                </td>
                <td class="px-6 py-4">
                  <span [ngClass]="s.score >= 70 ? 'text-emerald-600 font-bold' : 'text-slate-900 font-semibold'">{{ s.score }}</span>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="px-6 py-12 text-center text-slate-400">No student records found.</td>
              </tr>
            }
          }
        </tbody>
      </table>
    </div>

    <div class="p-6 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
      <p class="text-xs text-slate-500">Showing <span class="font-medium text-slate-900">{{ students.length }}</span> of <span class="font-medium text-slate-900">{{ totalElements | number }}</span> records</p>
      <div class="flex gap-2">
        <button (click)="pageChange.emit(page - 1)" [disabled]="page === 0 || isTableLoading" class="px-4 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all flex items-center gap-2">
          @if (isTableLoading) {
            <span class="w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></span>
          }
          Previous
        </button>
        <div class="flex items-center px-4 text-xs font-bold text-slate-600">Page {{ page + 1 }} of {{ totalPages || 1 }}</div>
        <button (click)="pageChange.emit(page + 1)" [disabled]="(page + 1) * size >= totalElements || isTableLoading" class="px-4 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all flex items-center gap-2">
          @if (isTableLoading) {
            <span class="w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></span>
          }
          Next
        </button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportTabComponent {
  @Input({ required: true }) students!: Student[];
  @Input({ required: true }) totalElements!: number;
  @Input({ required: true }) page!: number;
  @Input({ required: true }) size!: number;
  @Input({ required: true }) totalPages!: number;
  @Input() isTableLoading = false;
  @Input() isExporting = false;
  @Input() exportingFormat: ExportFormat | null = null;
  @Input({ required: true }) classes!: string[];
  @Input() searchId: number | undefined;
  @Input() filterClass = '';
  @Input() message = '';
  @Input() canRetry = false;
  @Input() retryLabel = 'Retry';

  @Output() searchIdChange = new EventEmitter<number | undefined>();
  @Output() filterClassChange = new EventEmitter<string>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() sizeChange = new EventEmitter<number>();
  @Output() export = new EventEmitter<ExportFormat>();
  @Output() retry = new EventEmitter<void>();

  onExport(format: ExportFormat): void {
    if (this.isExporting) return;
    this.export.emit(format);
  }

  onSearchIdChange(value: number | string | null): void {
    if (value === '' || value === null) {
      this.searchIdChange.emit(undefined);
      return;
    }

    const parsed = Number(value);
    this.searchIdChange.emit(Number.isFinite(parsed) ? parsed : undefined);
  }

  getAge(dob: string): number | '' {
    const birthDate = new Date(dob);
    if (Number.isNaN(birthDate.getTime())) return '';

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }

    return age;
  }
}
