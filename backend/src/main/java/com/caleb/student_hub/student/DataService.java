package com.caleb.student_hub.student;

import com.caleb.student_hub.student.dto.CsvProcessResult;
import com.caleb.student_hub.student.dto.ExcelGenerationResult;
import com.caleb.student_hub.student.dto.StudentDTO;
import com.caleb.student_hub.student.dto.UploadResult;
import com.opencsv.exceptions.CsvValidationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface DataService {
    ExcelGenerationResult generateExcel(int count) throws IOException;

    CsvProcessResult processExcelToCsv(MultipartFile file) throws IOException;

    UploadResult uploadCsvToDb(MultipartFile file) throws IOException, CsvValidationException;

    Page<StudentDTO> getStudents(Pageable pageable, Long studentId, String studentClass);
}
