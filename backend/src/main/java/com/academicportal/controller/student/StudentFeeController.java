package com.academicportal.controller.student;

import com.academicportal.entity.FeePayment;
import com.academicportal.entity.User;
import com.academicportal.repository.FeePaymentRepository;
import com.academicportal.service.FeeService;
import com.academicportal.service.PdfReceiptService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/student/fees")
public class StudentFeeController {

    private final FeeService feeService;
    private final PdfReceiptService pdfReceiptService;
    private final FeePaymentRepository feePaymentRepository;

    public StudentFeeController(FeeService feeService, PdfReceiptService pdfReceiptService, FeePaymentRepository feePaymentRepository) {
        this.feeService = feeService;
        this.pdfReceiptService = pdfReceiptService;
        this.feePaymentRepository = feePaymentRepository;
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getSummary(@AuthenticationPrincipal User student) {
        try {
            return ResponseEntity.ok(feeService.getFeeSummary(student.getId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/pay")
    public ResponseEntity<?> payFee(@AuthenticationPrincipal User student, @RequestBody Map<String, Object> payload) {
        try {
            Integer feeStructureId = (Integer) payload.get("feeStructureId");
            double amount = Double.parseDouble(payload.get("amount").toString());
            String paymentMode = (String) payload.get("paymentMode");
            String txRef = (String) payload.get("transactionRef");

            FeePayment payment = feeService.processPayment(student.getId(), feeStructureId, amount, paymentMode, txRef);
            return ResponseEntity.ok(payment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/receipt/{receiptNumber}")
    public ResponseEntity<byte[]> downloadReceipt(@PathVariable String receiptNumber) {
        FeePayment payment = feePaymentRepository.findByReceiptNumber(receiptNumber)
                .orElse(null);

        if (payment == null) {
            return ResponseEntity.notFound().build();
        }

        byte[] receiptContent = pdfReceiptService.generateReceiptPdf(payment);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=receipt-" + receiptNumber + ".txt")
                .contentType(MediaType.TEXT_PLAIN)
                .body(receiptContent);
    }
}
