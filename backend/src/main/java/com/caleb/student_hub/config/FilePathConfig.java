package com.caleb.student_hub.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FilePathConfig {

    @Bean
    public String fileDirectory() {
        String os = System.getProperty("os.name").toLowerCase();
        String userHome = System.getProperty("user.home");
        
        if (os.contains("win")) {
            return "C:\\var\\log\\applications\\API\\dataprocessing\\";
        } else if (os.contains("mac")) {
            return userHome + "/Library/Logs/applications/API/dataprocessing/";
        } else {
            return "/var/log/applications/API/dataprocessing/";
        }
    }
}
