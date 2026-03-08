package com.caleb.student_hub.student;

import com.caleb.student_hub.student.dto.StudentDTO;
import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.opencsv.CSVWriter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.xssf.streaming.SXSSFSheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.ArrayDeque;
import java.util.Queue;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class ReportExportServiceImp implements ReportExport {

    private final StudentRepository studentRepository;
    private final ExecutorService executorService;

    // Larger pages = fewer DB round trips
    private static final int PAGE_SIZE = 5_000;
    // How many pages to prefetch ahead while writing
    private static final int PREFETCH_DEPTH = 3;
    private static final String[] EXPORT_HEADERS = {"studentId", "firstName", "lastName", "DOB", "class", "score"};
    private static final Sort EXPORT_SORT = Sort.by(Sort.Direction.ASC, "studentId");

    public ReportExportServiceImp(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
        this.executorService = Executors.newFixedThreadPool(PREFETCH_DEPTH);
    }

    @Override
    public void exportToCsv(Long studentId, String studentClass, OutputStream outputStream) throws IOException {
        String normalizedClass = normalizeClass(studentClass);

        try (BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(outputStream, StandardCharsets.UTF_8), 64 * 1024);
             CSVWriter csvWriter = new CSVWriter(bw)) {

            csvWriter.writeNext(EXPORT_HEADERS);

            streamPages(studentId, normalizedClass, page -> {
                for (StudentDTO s : page.getContent()) {
                    csvWriter.writeNext(toStringArray(s), false);
                }
                try {
                    csvWriter.flush();
                } catch (IOException e) {
                    throw new UncheckedIOException(e);
                }
            });
        }
    }

    @Override
    public void exportToExcel(Long studentId, String studentClass, OutputStream outputStream) throws IOException {
        String normalizedClass = normalizeClass(studentClass);

        try (SXSSFWorkbook workbook = new SXSSFWorkbook(500)) {
            SXSSFSheet sheet = workbook.createSheet("Students");
            sheet.setRandomAccessWindowSize(500);

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < EXPORT_HEADERS.length; i++) {
                headerRow.createCell(i).setCellValue(EXPORT_HEADERS[i]);
            }

            int[] rowIdx = {1};
            streamPages(studentId, normalizedClass, page -> {
                for (StudentDTO s : page.getContent()) {
                    Row row = sheet.createRow(rowIdx[0]++);
                    row.createCell(0).setCellValue(s.studentId());
                    row.createCell(1).setCellValue(s.firstName());
                    row.createCell(2).setCellValue(s.lastName());
                    row.createCell(3).setCellValue(s.dob().toString());
                    row.createCell(4).setCellValue(s.studentClass());
                    row.createCell(5).setCellValue(s.score());
                }
            });

            workbook.write(outputStream);
        }
    }

    @Override
    public void exportToPdf(Long studentId, String studentClass, OutputStream outputStream) {
        String normalizedClass = normalizeClass(studentClass);
        Document document = null;
        try {
            document = new Document(PageSize.A4.rotate());
            PdfWriter writer = PdfWriter.getInstance(document, outputStream);
            document.open();

            PdfPTable pdfTable = new PdfPTable(6);
            pdfTable.setWidthPercentage(100);
            pdfTable.setWidths(new float[]{1f, 2f, 2f, 2f, 1f, 1f});
            pdfTable.setComplete(false); // Allows incremental flushing
            Font headerFont = new Font(Font.HELVETICA, 10, Font.BOLD);
            for (String h : EXPORT_HEADERS) {
                pdfTable.addCell(new Phrase(h, headerFont));
            }

            document.add(pdfTable);
            final Document finalDocument = document;

            streamPages(studentId, normalizedClass, page -> {
                for (StudentDTO s : page.getContent()) {
                    pdfTable.addCell(String.valueOf(s.studentId()));
                    pdfTable.addCell(s.firstName());
                    pdfTable.addCell(s.lastName());
                    pdfTable.addCell(String.valueOf(s.dob()));
                    pdfTable.addCell(s.studentClass());
                    pdfTable.addCell(String.valueOf(s.score()));
                }
                writer.flush();
            });

            pdfTable.setComplete(true);
            document.add(pdfTable);

        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF", e);
        } finally {
            if (document != null && document.isOpen()) document.close();
        }
    }

    // Fetches pages from DB ahead of time using async prefetch queue
    private void streamPages(Long studentId, String normalizedClass,
                             PageConsumer consumer) {
        int pageNumber = 0;
        Queue<CompletableFuture<Page<StudentDTO>>> prefetchQueue = new ArrayDeque<>();

        for (int i = 0; i < PREFETCH_DEPTH; i++) {
            final int p = pageNumber + i;
            prefetchQueue.add(CompletableFuture.supplyAsync(
                    () -> studentRepository.findStudents(pageRequest(p), studentId, normalizedClass),
                    executorService
            ));
        }
        pageNumber += PREFETCH_DEPTH;

        while (!prefetchQueue.isEmpty()) {
            Page<StudentDTO> page;
            try {
                page = prefetchQueue.poll().get();
            } catch (InterruptedException | ExecutionException e) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("Prefetch failed", e);
            }

            consumer.accept(page);

            if (page.hasNext()) {
                final int p = pageNumber++;
                prefetchQueue.add(CompletableFuture.supplyAsync(
                        () -> studentRepository.findStudents(pageRequest(p), studentId, normalizedClass),
                        executorService
                ));
            }
        }
    }

    private PageRequest pageRequest(int pageNumber) {
        return PageRequest.of(pageNumber, PAGE_SIZE, EXPORT_SORT);
    }

    private String[] toStringArray(StudentDTO s) {
        return new String[]{
                String.valueOf(s.studentId()),
                s.firstName(),
                s.lastName(),
                String.valueOf(s.dob()),
                s.studentClass(),
                String.valueOf(s.score())
        };
    }

    private String normalizeClass(String studentClass) {
        if (studentClass == null) return null;
        String trimmed = studentClass.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    @FunctionalInterface
    interface PageConsumer {
        void accept(Page<StudentDTO> page);
    }
}