package com.caleb.student_hub.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class FilePathConfig {

    @Bean
    public String fileDirectory() {
        String override = System.getenv("FILE_DIRECTORY");
        if (override != null && !override.isBlank()) {
            return ensureWritableOrFallback(override);
        }

        String os = System.getProperty("os.name").toLowerCase();
        String userHome = System.getProperty("user.home");
        String preferred;

        if (os.contains("win")) {
            preferred = "C:\\var\\log\\applications\\API\\dataprocessing\\";
        } else if (os.contains("mac")) {
            preferred = userHome + "/Library/Logs/applications/API/dataprocessing/";
        } else {
            preferred = "/var/log/applications/API/dataprocessing/";
        }

        return ensureWritableOrFallback(preferred);
    }

    private String ensureWritableOrFallback(String preferredPath) {
        Path preferred = Paths.get(preferredPath);
        try {
            Files.createDirectories(preferred);
            if (Files.isWritable(preferred)) {
                return preferred.toString();
            }
        } catch (IOException ignored) {
            // Fall back to a writable temp path.
        }

        Path fallback = Paths.get(System.getProperty("java.io.tmpdir"), "student-hub", "dataprocessing");
        try {
            Files.createDirectories(fallback);
        } catch (IOException e) {
            throw new RuntimeException("Unable to create fallback data directory: " + fallback, e);
        }
        return fallback.toString();
    }
}
