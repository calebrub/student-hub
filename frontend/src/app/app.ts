import { Component, HostListener, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { StudentService, Student } from './student.service';
import { getHttpErrorMessage } from './http-error.util';
import { GenerateTabComponent } from './components/generate-tab.component';
import { ProcessTabComponent } from './components/process-tab.component';
import { UploadTabComponent } from './components/upload-tab.component';
import { ReportTabComponent, ExportFormat } from './components/report-tab.component';
import { AppTab, TabNavComponent } from './components/tab-nav.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    TabNavComponent,
    GenerateTabComponent,
    ProcessTabComponent,
    UploadTabComponent,
    ReportTabComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private readonly validTabs: ReadonlySet<AppTab> = new Set(['generate', 'process', 'upload', 'report']);

  activeTab = signal<AppTab>('generate');
  isLoading = signal(false);
  
  // Task A
  recordCount = signal(1000000);
  generateMsg = signal('');
  canRetryGenerate = signal(false);

  // Task B
  excelFile = signal<File | null>(null);
  processMsg = signal('');
  canRetryProcess = signal(false);

  // Task C
  csvFile = signal<File | null>(null);
  uploadMsg = signal('');
  canRetryUpload = signal(false);

  // Task D
  students = signal<Student[]>([]);
  page = signal(0);
  size = signal(100);
  totalElements = signal(0);
  reportLoading = signal(false);
  exportLoadingFormat = signal<ExportFormat | null>(null);
  searchId = signal<number | undefined>(undefined);
  filterClass = signal('');
  reportMsg = signal('');
  reportRetryAction = signal<'load' | 'export' | null>(null);
  lastFailedExportFormat = signal<ExportFormat | null>(null);
  classes = signal(['Class1', 'Class2', 'Class3', 'Class4', 'Class5']);

  totalPages = computed(() => Math.ceil(this.totalElements() / this.size()));

  constructor(private studentService: StudentService) {}

  ngOnInit() {
    this.syncTabWithUrl();
    this.loadStudents();
  }

  @HostListener('window:hashchange')
  onHashChange(): void {
    this.syncTabWithUrl(false);
  }

  setTab(tab: AppTab, updateUrl = true) {
    this.activeTab.set(tab);
    if (updateUrl) {
      window.history.replaceState(null, '', `#/${tab}`);
    }
    if (tab === 'report') {
      this.loadStudents();
    }
  }

  private syncTabWithUrl(updateInvalidUrl = true): void {
    const rawPath = window.location.hash.replace(/^#\/?/, '').split('?')[0];
    if (this.isAppTab(rawPath)) {
      this.setTab(rawPath, false);
      return;
    }

    this.setTab('generate', false);
    if (updateInvalidUrl) {
      window.history.replaceState(null, '', '#/generate');
    }
  }

  private isAppTab(value: string): value is AppTab {
    return this.validTabs.has(value as AppTab);
  }

  onGenerate(): void {
    this.isLoading.set(true);
    this.generateMsg.set('');
    this.canRetryGenerate.set(false);
    this.studentService.generateData(this.recordCount()).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (res) => {
        this.generateMsg.set(res);
      },
      error: (err) => {
        this.generateMsg.set(`Error: ${getHttpErrorMessage(err, 'Failed to generate data.')}`);
        this.canRetryGenerate.set(true);
      }
    });
  }

  setRecordCount(value: number): void {
    this.recordCount.set(value);
  }

  setExcelFile(file: File | null): void {
    this.excelFile.set(file);
  }

  onProcess(): void {
    const file = this.excelFile();
    if (!file) return;

    this.isLoading.set(true);
    this.processMsg.set('');
    this.canRetryProcess.set(false);
    this.studentService.processExcel(file).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (res) => {
        this.processMsg.set(res);
      },
      error: (err) => {
        this.processMsg.set(`Error: ${getHttpErrorMessage(err, 'Failed to process Excel file.')}`);
        this.canRetryProcess.set(true);
      }
    });
  }

  setCsvFile(file: File | null): void {
    this.csvFile.set(file);
  }

  onUpload(): void {
    const file = this.csvFile();
    if (!file) return;

    this.isLoading.set(true);
    this.uploadMsg.set('');
    this.canRetryUpload.set(false);
    this.studentService.uploadCsv(file).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (res) => {
        this.uploadMsg.set(res);
      },
      error: (err) => {
        this.uploadMsg.set(`Error: ${getHttpErrorMessage(err, 'Failed to upload CSV file.')}`);
        this.canRetryUpload.set(true);
      }
    });
  }

  loadStudents(): void {
    this.reportLoading.set(true);
    this.reportMsg.set('');
    this.reportRetryAction.set(null);
    this.lastFailedExportFormat.set(null);
    this.studentService.getStudents(this.page(), this.size(), this.searchId(), this.filterClass()).pipe(
      finalize(() => this.reportLoading.set(false))
    ).subscribe({
      next: (res) => {
        this.students.set(res.content);
        this.totalElements.set(res.totalElements);
      },
      error: (err) => {
        this.reportMsg.set(getHttpErrorMessage(err, 'Failed to load student report.'));
        this.reportRetryAction.set('load');
      }
    });
  }

  setSearchId(searchId: number | undefined): void {
    this.searchId.set(searchId);
    this.onSearch();
  }

  setFilterClass(filterClass: string): void {
    this.filterClass.set(filterClass);
    this.onSearch();
  }

  onSearch(): void {
    this.page.set(0);
    this.loadStudents();
  }

  onPageChange(p: number): void {
    this.page.set(p);
    this.loadStudents();
  }

  onSizeChange(s: number): void {
    this.size.set(s);
    this.page.set(0);
    this.loadStudents();
  }

  export(format: ExportFormat): void {
    this.exportLoadingFormat.set(format);
    this.reportMsg.set('');
    this.reportRetryAction.set(null);
    this.lastFailedExportFormat.set(null);
    let obs: ReturnType<StudentService['exportCsv']>;
    const sid = this.searchId();
    const fclass = this.filterClass();

    if (format === 'csv') obs = this.studentService.exportCsv(sid, fclass);
    else if (format === 'excel') obs = this.studentService.exportExcel(sid, fclass);
    else obs = this.studentService.exportPdf(sid, fclass);

    obs.pipe(
      finalize(() => this.exportLoadingFormat.set(null))
    ).subscribe({
      next: (blob) => {
        this.reportMsg.set('');
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `students.${format === 'excel' ? 'xlsx' : format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.reportMsg.set(getHttpErrorMessage(err, `Failed to export ${format.toUpperCase()} report.`));
        this.reportRetryAction.set('export');
        this.lastFailedExportFormat.set(format);
      }
    });
  }

  retryGenerate(): void {
    this.onGenerate();
  }

  retryProcess(): void {
    this.onProcess();
  }

  retryUpload(): void {
    this.onUpload();
  }

  retryReport(): void {
    const action = this.reportRetryAction();

    if (action === 'load') {
      this.loadStudents();
      return;
    }

    if (action === 'export' && this.lastFailedExportFormat()) {
      const format = this.lastFailedExportFormat();
      if (format) this.export(format);
    }
  }

  getReportRetryLabel(): string {
    return this.reportRetryAction() === 'export' ? 'Retry Export' : 'Retry Load';
  }
}
