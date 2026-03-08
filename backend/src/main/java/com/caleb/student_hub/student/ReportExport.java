package com.caleb.student_hub.student;

import java.io.IOException;
import java.io.OutputStream;

public interface ReportExport {
    void exportToCsv(Long studentId, String studentClass, OutputStream outputStream) throws IOException;

    void exportToExcel(Long studentId, String studentClass, OutputStream outputStream) throws IOException;

    void exportToPdf(Long studentId, String studentClass, OutputStream outputStream);
}
