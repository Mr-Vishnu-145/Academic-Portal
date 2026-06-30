package com.academicportal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

@SpringBootApplication
public class AcademicPortalApplication {
    public static void main(String[] args) {
        // Load .env file if it exists
        try {
            if (Files.exists(Paths.get(".env"))) {
                Files.lines(Paths.get(".env"))
                    .map(String::trim)
                    .filter(line -> !line.isEmpty() && !line.startsWith("#"))
                    .forEach(line -> {
                        int delim = line.indexOf('=');
                        if (delim > 0) {
                            String key = line.substring(0, delim).trim();
                            String value = line.substring(delim + 1).trim();
                            // Strip quotes if any
                            if (value.startsWith("\"") && value.endsWith("\"")) {
                                value = value.substring(1, value.length() - 1);
                            } else if (value.startsWith("'") && value.endsWith("'")) {
                                value = value.substring(1, value.length() - 1);
                            }
                            System.setProperty(key, value);
                        }
                    });
            }
        } catch (IOException e) {
            System.err.println("Failed to load .env file: " + e.getMessage());
        }

        SpringApplication.run(AcademicPortalApplication.class, args);
    }
}
