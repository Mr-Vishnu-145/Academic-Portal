package com.academicportal.service;

import com.academicportal.entity.*;
import com.academicportal.repository.FeePaymentRepository;
import com.academicportal.repository.FeeStructureRepository;
import com.academicportal.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
public class FeeService {

    private final FeeStructureRepository feeStructureRepository;
    private final FeePaymentRepository feePaymentRepository;
    private final UserRepository userRepository;

    public FeeService(FeeStructureRepository feeStructureRepository,
                      FeePaymentRepository feePaymentRepository,
                      UserRepository userRepository) {
        this.feeStructureRepository = feeStructureRepository;
        this.feePaymentRepository = feePaymentRepository;
        this.userRepository = userRepository;
    }

    public List<FeeStructure> getFeeStructuresForClass(Integer departmentId, Integer year) {
        return feeStructureRepository.findByDepartmentIdAndYear(departmentId, year);
    }

    public List<FeePayment> getStudentPayments(Integer studentId) {
        return feePaymentRepository.findByStudentId(studentId);
    }

    public Map<String, Object> getFeeSummary(Integer studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));

        if (student.getDepartment() == null || student.getYear() == null) {
            throw new IllegalArgumentException("Student has no department or year assigned");
        }

        List<FeeStructure> feeStructures = feeStructureRepository.findByDepartmentIdAndYear(
                student.getDepartment().getId(), student.getYear());

        List<FeePayment> payments = feePaymentRepository.findByStudentId(studentId);

        BigDecimal totalDue = BigDecimal.ZERO;
        BigDecimal totalPaid = BigDecimal.ZERO;
        List<Map<String, Object>> pendingFees = new ArrayList<>();
        List<Map<String, Object>> paidFees = new ArrayList<>();

        for (FeeStructure fs : feeStructures) {
            totalDue = totalDue.add(fs.getAmount());

            Optional<FeePayment> paymentOpt = payments.stream()
                    .filter(p -> p.getFeeStructure().getId().equals(fs.getId()))
                    .findFirst();

            if (paymentOpt.isPresent()) {
                FeePayment p = paymentOpt.get();
                totalPaid = totalPaid.add(p.getAmountPaid());
                
                if (p.getStatus() == PaymentStatus.PAID) {
                    Map<String, Object> paidMap = new HashMap<>();
                    paidMap.put("feeId", fs.getId());
                    paidMap.put("feeType", fs.getFeeType());
                    paidMap.put("amount", fs.getAmount());
                    paidMap.put("amountPaid", p.getAmountPaid());
                    paidMap.put("paymentDate", p.getPaymentDate());
                    paidMap.put("receiptNumber", p.getReceiptNumber());
                    paidMap.put("receiptUrl", p.getReceiptUrl());
                    paidFees.add(paidMap);
                } else {
                    // Partial payment or other status
                    BigDecimal remaining = fs.getAmount().subtract(p.getAmountPaid());
                    Map<String, Object> pendingMap = new HashMap<>();
                    pendingMap.put("feeId", fs.getId());
                    pendingMap.put("feeType", fs.getFeeType());
                    pendingMap.put("amount", fs.getAmount());
                    pendingMap.put("amountPaid", p.getAmountPaid());
                    pendingMap.put("remaining", remaining);
                    pendingMap.put("dueDate", fs.getDueDate());
                    pendingFees.add(pendingMap);
                }
            } else {
                Map<String, Object> pendingMap = new HashMap<>();
                pendingMap.put("feeId", fs.getId());
                pendingMap.put("feeType", fs.getFeeType());
                pendingMap.put("amount", fs.getAmount());
                pendingMap.put("amountPaid", BigDecimal.ZERO);
                pendingMap.put("remaining", fs.getAmount());
                pendingMap.put("dueDate", fs.getDueDate());
                pendingFees.add(pendingMap);
            }
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalDue", totalDue);
        summary.put("totalPaid", totalPaid);
        summary.put("totalPending", totalDue.subtract(totalPaid));
        summary.put("pendingFees", pendingFees);
        summary.put("paidFees", paidFees);

        return summary;
    }

    @Transactional
    public FeePayment processPayment(Integer studentId, Integer feeStructureId, double amount, String modeStr, String txRef) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));

        FeeStructure fs = feeStructureRepository.findById(feeStructureId)
                .orElseThrow(() -> new IllegalArgumentException("Fee structure not found"));

        PaymentMode mode = PaymentMode.valueOf(modeStr.toUpperCase());
        
        Optional<FeePayment> existingPaymentOpt = feePaymentRepository.findByStudentIdAndFeeStructureId(studentId, feeStructureId);
        FeePayment payment = existingPaymentOpt.orElse(new FeePayment());

        BigDecimal parsedAmount = BigDecimal.valueOf(amount);
        BigDecimal newPaidAmount = payment.getAmountPaid() != null ? payment.getAmountPaid().add(parsedAmount) : parsedAmount;

        payment.setStudent(student);
        payment.setFeeStructure(fs);
        payment.setAmountPaid(newPaidAmount);
        payment.setPaymentMode(mode);
        payment.setPaymentDate(LocalDate.now());
        
        if (payment.getReceiptNumber() == null) {
            payment.setReceiptNumber("REC" + System.currentTimeMillis() + studentId);
        }
        payment.setTransactionRef(txRef);

        if (newPaidAmount.compareTo(fs.getAmount()) >= 0) {
            payment.setStatus(PaymentStatus.PAID);
        } else {
            payment.setStatus(PaymentStatus.PARTIAL);
        }

        payment.setReceiptUrl("/api/student/fees/receipt/" + payment.getReceiptNumber());
        
        return feePaymentRepository.save(payment);
    }
}
