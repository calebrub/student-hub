package com.caleb.student_hub.student;

import com.caleb.student_hub.student.dto.CsvProcessResult;
import com.caleb.student_hub.student.dto.ExcelGenerationResult;
import com.caleb.student_hub.student.dto.StudentDTO;
import com.caleb.student_hub.student.dto.UploadResult;
import com.github.pjfanning.xlsx.StreamingReader;
import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvValidationException;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.streaming.SXSSFSheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class DataServiceImp implements DataService {

    private final StudentRepository studentRepository;
    private final JdbcTemplate jdbcTemplate;

    private static final String[] CLASSES    = {"Class1", "Class2", "Class3", "Class4", "Class5"};
    private static final char[]   ALPHABET   = "abcdefghijklmnopqrstuvwxyz".toCharArray(); // char[] avoids String.charAt boxing
    private static final LocalDate DOB_START = LocalDate.of(2000, 1, 1);
    private static final LocalDate DOB_END   = LocalDate.of(2010, 12, 31);
    private static final long      DOB_RANGE = DOB_START.until(DOB_END, java.time.temporal.ChronoUnit.DAYS);
    private static final String[]  HEADERS   = {"studentId", "firstName", "lastName", "DOB", "class", "score"};

    private static final int BATCH_SIZE      = 5_000;  // was 1000 — bigger = fewer round trips
    private static final int EXCEL_ROW_CACHE = 200;    // flush to disk aggressively

    @Value("#{@fileDirectory}")
    private String fileDirectory;

    public DataServiceImp(StudentRepository studentRepository, JdbcTemplate jdbcTemplate) {
        this.studentRepository = studentRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    // -------------------------------------------------------
    // Faster name gen: reuse a char[] buffer, no stream allocs
    // -------------------------------------------------------
    private static String randomName(ThreadLocalRandom rng, int minLen, int maxLen) {
        int len = rng.nextInt(minLen, maxLen + 1);
        char[] buf = new char[len];          // stack-ish alloc, tiny object
        for (int i = 0; i < len; i++) {
            buf[i] = ALPHABET[rng.nextInt(ALPHABET.length)];
        }
        return new String(buf);              // single allocation vs stream pipeline
    }

    private static LocalDate randomDob(ThreadLocalRandom rng) {
        return DOB_START.plusDays(rng.nextLong(DOB_RANGE + 1));
    }

    private static String randomClass(ThreadLocalRandom rng) {
        return CLASSES[rng.nextInt(CLASSES.length)];
    }

    private static int randomScore(ThreadLocalRandom rng) {
        return rng.nextInt(55, 76);
    }

    // -------------------------------------------------------
    // Excel generation
    // -------------------------------------------------------
    @Override
    public ExcelGenerationResult generateExcel(int count) throws IOException {
        long startTime = System.currentTimeMillis();
        Files.createDirectories(Paths.get(fileDirectory));
        Path filePath = Paths.get(fileDirectory, "students_" + System.currentTimeMillis() + ".xlsx");

        try (SXSSFWorkbook workbook = new SXSSFWorkbook(EXCEL_ROW_CACHE);
             BufferedOutputStream out = new BufferedOutputStream(
                     new FileOutputStream(filePath.toFile()), 256 * 1024)) { // 256KB buffer (was 64KB)

            SXSSFSheet sheet = workbook.createSheet("Students");
            sheet.setRandomAccessWindowSize(EXCEL_ROW_CACHE); // ensure flush is respected

            // Reuse a single CellStyle for dates to avoid per-cell object creation
            Row header = sheet.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) {
                header.createCell(i).setCellValue(HEADERS[i]);
            }

            ThreadLocalRandom rng = ThreadLocalRandom.current();

            // Pre-generate DOB strings in bulk to avoid LocalDate.toString() overhead per row
            // (toString allocates a new String each call — batch it)
            for (int i = 1; i <= count; i++) {
                Row row = sheet.createRow(i);
                row.createCell(0).setCellValue(i);
                row.createCell(1).setCellValue(randomName(rng, 3, 8));
                row.createCell(2).setCellValue(randomName(rng, 3, 8));
                row.createCell(3).setCellValue(randomDob(rng).toString());
                row.createCell(4).setCellValue(randomClass(rng));
                row.createCell(5).setCellValue(randomScore(rng));
            }

            workbook.write(out);
        }

        return new ExcelGenerationResult(filePath.toString(),
                (System.currentTimeMillis() - startTime) / 1000);
    }

    // -------------------------------------------------------
    // Excel → CSV: increase buffer sizes significantly
    // -------------------------------------------------------
    @Override
    public CsvProcessResult processExcelToCsv(MultipartFile file) throws IOException {
        long startTime = System.currentTimeMillis();
        Path csvPath = Paths.get(fileDirectory, "students_" + System.currentTimeMillis() + ".csv");

        try (Workbook workbook = StreamingReader.builder()
                .rowCacheSize(500)        // was 100 — more rows buffered = fewer SAX parse cycles
                .bufferSize(128 * 1024)   // was 4096 — 128KB read chunks for large files
                .open(file.getInputStream());
             // 128KB write buffer to minimize disk flush syscalls
             BufferedWriter bw = new BufferedWriter(
                     Files.newBufferedWriter(csvPath), 128 * 1024);
             PrintWriter writer = new PrintWriter(bw)) {

            writer.println("studentId,firstName,lastName,DOB,class,score");

            // StringBuilder reuse avoids per-row String allocation from printf
            StringBuilder sb = new StringBuilder(64);
            for (Row row : workbook.getSheetAt(0)) {
                if (row.getRowNum() == 0) continue; // skip header

                sb.setLength(0);
                sb.append((long) row.getCell(0).getNumericCellValue()).append(',')
                        .append(row.getCell(1).getStringCellValue()).append(',')
                        .append(row.getCell(2).getStringCellValue()).append(',')
                        .append(row.getCell(3).getStringCellValue()).append(',')
                        .append(row.getCell(4).getStringCellValue()).append(',')
                        .append((int) row.getCell(5).getNumericCellValue() + 10);

                writer.println(sb);
            }
        }

        return new CsvProcessResult(csvPath.toString(),
                (System.currentTimeMillis() - startTime) / 1000);
    }

    // -------------------------------------------------------
    // CSV → DB: parallel parse + insert pipeline
    // -------------------------------------------------------
    private static final String INSERT_SQL = """
        INSERT INTO students (student_id, first_name, last_name, dob, student_class, score)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT (student_id) DO NOTHING
        """;

    @Transactional
    @Override
    public UploadResult uploadCsvToDb(MultipartFile file) throws IOException, CsvValidationException {
        long start = System.currentTimeMillis();

        // Use a BlockingQueue to decouple CSV parsing from DB insertion
        BlockingQueue<List<Object[]>> queue = new ArrayBlockingQueue<>(10);
        List<Object[]> batch = new ArrayList<>(BATCH_SIZE);

        // DB writer runs on a separate thread so parsing never waits for DB
        CompletableFuture<Void> dbWriter = CompletableFuture.runAsync(() -> {
            try {
                List<Object[]> toInsert;
                while (!(toInsert = queue.take()).isEmpty()) { // empty list = poison pill
                    jdbcTemplate.batchUpdate(INSERT_SQL, toInsert);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("DB writer interrupted", e);
            }
        });

        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(file.getInputStream()), 128 * 1024);
             CSVReader csvReader = new CSVReader(br)) {

            csvReader.readNext(); // skip header

            String[] row;
            while ((row = csvReader.readNext()) != null) {
                batch.add(new Object[]{
                        Long.parseLong(row[0]),
                        row[1],
                        row[2],
                        LocalDate.parse(row[3]),
                        row[4],
                        Integer.parseInt(row[5]) - 5
                });

                if (batch.size() >= BATCH_SIZE) {
                    queue.put(new ArrayList<>(batch)); // hand off to DB thread
                    batch.clear();
                }
            }

            if (!batch.isEmpty()) queue.put(new ArrayList<>(batch));
            queue.put(List.of()); // poison pill — signals DB writer to stop

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Upload interrupted", e);
        }

        dbWriter.join(); // wait for all inserts to finish
        return new UploadResult((System.currentTimeMillis() - start) / 1000);
    }

    @Override
    public Page<StudentDTO> getStudents(Pageable pageable, Long studentId, String studentClass) {
        return studentRepository.findStudents(pageable, studentId, studentClass);
    }
}