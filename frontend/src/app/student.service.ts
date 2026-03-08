import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface Student {
  studentId: number;
  firstName: string;
  lastName: string;
  dob: string;
  studentClass: string;
  score: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  generateData(count: number): Observable<string> {
    return this.http.post(`${this.apiUrl}/generate`, null, {
      params: { count },
      responseType: 'text'
    });
  }

  processExcel(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/process`, formData, {
      responseType: 'text'
    });
  }

  uploadCsv(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/upload`, formData, {
      responseType: 'text'
    });
  }

  getStudents(page: number, size: number, studentId?: number, studentClass?: string): Observable<PageResponse<Student>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (studentId) params = params.set('studentId', studentId.toString());
    if (studentClass) params = params.set('studentClass', studentClass);

    return this.http.get<PageResponse<Student>>(this.apiUrl, { params });
  }

  exportCsv(studentId?: number, studentClass?: string): Observable<Blob> {
    let params = new HttpParams();
    if (studentId) params = params.set('studentId', studentId.toString());
    if (studentClass) params = params.set('studentClass', studentClass);

    return this.http.get(`${this.apiUrl}/export/csv`, { params, responseType: 'blob' });
  }

  exportExcel(studentId?: number, studentClass?: string): Observable<Blob> {
    let params = new HttpParams();
    if (studentId) params = params.set('studentId', studentId.toString());
    if (studentClass) params = params.set('studentClass', studentClass);

    return this.http.get(`${this.apiUrl}/export/excel`, { params, responseType: 'blob' });
  }

  exportPdf(studentId?: number, studentClass?: string): Observable<Blob> {
    let params = new HttpParams();
    if (studentId) params = params.set('studentId', studentId.toString());
    if (studentClass) params = params.set('studentClass', studentClass);

    return this.http.get(`${this.apiUrl}/export/pdf`, { params, responseType: 'blob' });
  }
}
