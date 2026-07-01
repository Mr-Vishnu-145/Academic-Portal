package com.academicportal.service;

import com.academicportal.entity.FeePayment;
import org.springframework.stereotype.Service;
import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;

@Service
public class PdfReceiptService {

    /**
     * Generates a downloadable text/PDF formatted document representing the receipt.
     * We output a clean text receipt that can be downloaded and printed.
     */
    public byte[] generateReceiptPdf(FeePayment payment) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PrintWriter writer = new PrintWriter(baos);

        writer.println("=========================================================");
        writer.println("                   ACADEMIC PORTAL                       ");
        writer.println("                   OFFICIAL RECEIPT                      ");
        writer.println("=========================================================");
        writer.println("Receipt Number  : " + payment.getReceiptNumber());
        writer.println("Date            : " + payment.getPaymentDate());
        writer.println("Transaction Ref : " + payment.getTransactionRef());
        writer.println("---------------------------------------------------------");
        writer.println("Student Name    : " + payment.getStudent().getName());
        writer.println("Register Number : " + payment.getStudent().getRegisterNumber());
        writer.println("Department      : " + (payment.getStudent().getDepartment() != null ? 
                                              payment.getStudent().getDepartment().getName() : "N/A"));
        writer.println("Year/Semester   : Year " + payment.getStudent().getYear());
        writer.println("---------------------------------------------------------");
        writer.println("Fee Description : " + payment.getFeeStructure().getFeeType());
        writer.println("Academic Year   : " + payment.getFeeStructure().getAcademicYear());
        writer.println("---------------------------------------------------------");
        writer.println("TOTAL DUE       : INR " + payment.getFeeStructure().getAmount());
        writer.println("AMOUNT PAID     : INR " + payment.getAmountPaid());
        writer.println("STATUS          : " + payment.getStatus());
        writer.println("Payment Mode    : " + payment.getPaymentMode());
        writer.println("=========================================================");
        writer.println("          Thank you for your payment.                    ");
        writer.println("   This is a system generated document. No signature required. ");
        writer.println("=========================================================");

        writer.flush();
        writer.close();

        return baos.toByteArray();
    }
}
