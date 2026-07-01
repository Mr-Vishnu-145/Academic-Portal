package com.academicportal.financial;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.academicportal")
@EnableJpaRepositories(basePackages = "com.academicportal.repository")
@EntityScan(basePackages = "com.academicportal.entity")
public class FinancialServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(FinancialServiceApplication.class, args);
    }
}
