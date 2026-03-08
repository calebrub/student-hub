import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AppTab = 'generate' | 'process' | 'upload' | 'report';

@Component({
  selector: 'app-tab-nav',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <img src="favicon.svg" alt="StudentHub logo" class="w-8 h-8 rounded-lg" />
          <h1 class="text-xl font-bold tracking-tight text-slate-900">StudentHub</h1>
        </div>
        <div class="flex gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            (click)="selectTab('generate')"
            [ngClass]="activeTab === 'generate' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
            class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
          >
            Generation
          </button>
          <button
            (click)="selectTab('process')"
            [ngClass]="activeTab === 'process' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
            class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
          >
            Processing
          </button>
          <button
            (click)="selectTab('upload')"
            [ngClass]="activeTab === 'upload' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
            class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
          >
            Upload
          </button>
          <button
            (click)="selectTab('report')"
            [ngClass]="activeTab === 'report' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
            class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
          >
            Report
          </button>
        </div>
      </div>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabNavComponent {
  @Input({ required: true }) activeTab!: AppTab;
  @Output() tabChange = new EventEmitter<AppTab>();

  selectTab(tab: AppTab): void {
    this.tabChange.emit(tab);
  }
}
