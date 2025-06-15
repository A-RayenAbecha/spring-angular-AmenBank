package com.bankamen.controller;

import com.bankamen.dto.LoanApplicationRequest;
import com.bankamen.dto.LoanApplicationResponse;
import com.bankamen.entity.LoanStatus;
import com.bankamen.service.AdminLoanService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/loans")
@PreAuthorize("hasRole('SUPERADMIN')")
public class AdminLoanController {
    private static final Logger logger = LoggerFactory.getLogger(AdminLoanController.class);

    @Autowired
    private AdminLoanService adminLoanService;

    /**
     * Get all loan applications
     */
    @GetMapping
    public ResponseEntity<List<LoanApplicationResponse>> getAllLoanApplications() {
        logger.info("Received request to get all loan applications");
        try {
            List<LoanApplicationResponse> applications = adminLoanService.getAllLoanApplications();
            logger.info("Returning {} loan applications", applications.size());
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            logger.error("Error getting all loan applications", e);
            throw e;
        }
    }

    /**
     * Get loan applications by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<LoanApplicationResponse>> getLoanApplicationsByStatus(@PathVariable LoanStatus status) {
        logger.info("Received request to get loan applications with status: {}", status);
        try {
            List<LoanApplicationResponse> applications = adminLoanService.getLoanApplicationsByStatus(status);
            logger.info("Returning {} loan applications with status {}", applications.size(), status);
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            logger.error("Error getting loan applications by status: {}", status, e);
            throw e;
        }
    }

    /**
     * Get a loan application by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<LoanApplicationResponse> getLoanApplicationById(@PathVariable Long id) {
        logger.info("Received request to get loan application with ID: {}", id);
        try {
            LoanApplicationResponse application = adminLoanService.getLoanApplicationById(id);
            logger.info("Returning loan application with ID: {}", id);
            return ResponseEntity.ok(application);
        } catch (Exception e) {
            logger.error("Error getting loan application with ID: {}", id, e);
            throw e;
        }
    }

    /**
     * Create a new loan application
     */
    @PostMapping
    public ResponseEntity<LoanApplicationResponse> createLoanApplication(@RequestBody LoanApplicationRequest request) {
        logger.info("Received request to create a new loan application");
        try {
            LoanApplicationResponse response = adminLoanService.createLoanApplication(request);
            logger.info("Created loan application with ID: {}", response.getId());
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            logger.error("Error creating loan application", e);
            throw e;
        }
    }

    /**
     * Update an existing loan application
     */
    @PutMapping("/{id}")
    public ResponseEntity<LoanApplicationResponse> updateLoanApplication(
            @PathVariable Long id,
            @RequestBody LoanApplicationRequest request) {
        logger.info("Received request to update loan application with ID: {}", id);
        try {
            LoanApplicationResponse response = adminLoanService.updateLoanApplication(id, request);
            logger.info("Updated loan application with ID: {}", id);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error updating loan application with ID: {}", id, e);
            throw e;
        }
    }

    /**
     * Update the status of a loan application
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<LoanApplicationResponse> updateLoanStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> statusUpdate) {
        String statusStr = statusUpdate.get("status");
        logger.info("Received request to update status of loan application with ID: {} to {}", id, statusStr);
        logger.info("Status update payload: {}", statusUpdate);
        
        try {
            if (statusStr == null || statusStr.isEmpty()) {
                logger.error("Status value is null or empty in request body");
                return ResponseEntity.badRequest().build();
            }
            
            LoanStatus status;
            try {
                status = LoanStatus.valueOf(statusStr);
            } catch (IllegalArgumentException e) {
                logger.error("Invalid status value: {}", statusStr, e);
                return ResponseEntity.badRequest().build();
            }
            
            LoanApplicationResponse response = adminLoanService.updateLoanStatus(id, status);
            logger.info("Updated status of loan application with ID: {} to {}", id, status);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error updating status of loan application with ID: {} to {}", id, statusUpdate.get("status"), e);
            throw e;
        }
    }

    /**
     * Delete a loan application
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLoanApplication(@PathVariable Long id) {
        logger.info("Received request to delete loan application with ID: {}", id);
        try {
            adminLoanService.deleteLoanApplication(id);
            logger.info("Deleted loan application with ID: {}", id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            logger.error("Error deleting loan application with ID: {}", id, e);
            throw e;
        }
    }
} 