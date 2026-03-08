package com.caleb.student_hub.student;

import com.caleb.student_hub.student.dto.CsvProcessResult;
import com.caleb.student_hub.student.dto.ExcelGenerationResult;
import com.caleb.student_hub.student.dto.StudentDTO;
import com.caleb.student_hub.student.dto.UploadResult;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.IOException;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "*")
public class StudentController {

    private final DataService dataService;
    private final ReportExport exportService;

    public StudentController(DataService dataService, ReportExport exportService) {
        this.dataService = dataService;
        this.exportService = exportService;
    }

    @PostMapping("/generate")
    public ResponseEntity<String> generateData(@RequestParam int count) throws IOException {
        ExcelGenerationResult result = dataService.generateExcel(count);
        return ResponseEntity.ok(String.format("File generated at: %s (Duration: %d seconds)", 
                result.filePath(), result.durationSeconds()));
    }

    @PostMapping("/process")
    public ResponseEntity<String> processExcel(@RequestParam("file") MultipartFile file) throws IOException {
        CsvProcessResult result = dataService.processExcelToCsv(file);
        return ResponseEntity.ok(String.format("CSV processed at: %s (Duration: %d seconds)",
                result.filePath(), result.durationSeconds()));
    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadCsv(@RequestParam("file") MultipartFile file) throws Exception {
        UploadResult result = dataService.uploadCsvToDb(file);
        return ResponseEntity.ok(String.format("Data uploaded to database successfully (Duration: %d seconds)",
                result.durationSeconds()));
    }

    @GetMapping
    public ResponseEntity<Page<StudentDTO>> getStudents(
            Pageable pageable,
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) String studentClass) {
        return ResponseEntity.ok(dataService.getStudents(pageable, studentId, studentClass));
    }

    @GetMapping("/export/csv")
    public ResponseEntity<StreamingResponseBody> exportCsv(
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) String studentClass) {
        
        StreamingResponseBody stream = outputStream -> exportService.exportToCsv(studentId, studentClass, outputStream);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=students.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(stream);
    }

    @GetMapping("/export/excel")
    public ResponseEntity<StreamingResponseBody> exportExcel(
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) String studentClass) {
        
        StreamingResponseBody stream = outputStream -> exportService.exportToExcel(studentId, studentClass, outputStream);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=students.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(stream);
    }

    @GetMapping("/export/pdf")
    public ResponseEntity<StreamingResponseBody> exportPdf(
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) String studentClass) {
        
        StreamingResponseBody stream = outputStream -> exportService.exportToPdf(studentId, studentClass, outputStream);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=students.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(stream);
    }
}
