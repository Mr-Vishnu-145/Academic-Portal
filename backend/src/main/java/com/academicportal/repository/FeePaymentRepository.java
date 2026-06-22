package com.academicportal.repository;

import com.academicportal.entity.FeePayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FeePaymentRepository extends JpaRepository<FeePayment, Integer> {
    List<FeePayment> findByStudentId(Integer studentId);
    Optional<FeePayment> findByStudentIdAndFeeStructureId(Integer studentId, Integer feeStructureId);
    Optional<FeePayment> findByReceiptNumber(String receiptNumber);
}
