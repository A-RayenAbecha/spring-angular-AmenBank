package com.bankamen.controller;

import com.bankamen.dto.ScheduledTransferDTO;
import com.bankamen.entity.ScheduledTransfer;
import com.bankamen.entity.BankAccount;
import com.bankamen.exception.BusinessException;
import com.bankamen.repository.ScheduledTransferRepository;
import com.bankamen.repository.BankAccountRepository;
import com.bankamen.service.ScheduledTransferService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/scheduled-transfers")
@PreAuthorize("hasRole('SUPERADMIN')")
public class AdminScheduledTransferController {
    
    private static final Logger logger = LoggerFactory.getLogger(AdminScheduledTransferController.class);
    
    @Autowired
    private ScheduledTransferRepository scheduledTransferRepository;
    
    @Autowired
    private BankAccountRepository bankAccountRepository;
    
    @Autowired
    private ScheduledTransferService scheduledTransferService;
    
    /**
     * Get all scheduled transfers with pagination and filtering
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllScheduledTransfers(
            @RequestParam(required = false) String sourceAccount,
            @RequestParam(required = false) String targetAccountNumber,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        
        logger.info("Fetching scheduled transfers with filters: sourceAccount={}, targetAccountNumber={}, active={}, status={}", 
                sourceAccount, targetAccountNumber, active, status);
        
        try {
            Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
            
            // Apply filters if provided
            Page<ScheduledTransfer> pageTransfers;
            
            if (sourceAccount != null || targetAccountNumber != null || active != null) {
                // Custom filtering logic
                List<ScheduledTransfer> filteredTransfers = scheduledTransferRepository.findAll();
                
                if (sourceAccount != null && !sourceAccount.isEmpty()) {
                    filteredTransfers = filteredTransfers.stream()
                            .filter(transfer -> transfer.getSourceAccount() != null && 
                                    transfer.getSourceAccount().getAccountNumber().equals(sourceAccount))
                            .collect(Collectors.toList());
                }
                
                if (targetAccountNumber != null && !targetAccountNumber.isEmpty()) {
                    filteredTransfers = filteredTransfers.stream()
                            .filter(transfer -> transfer.getTargetAccountNumber() != null && 
                                    transfer.getTargetAccountNumber().equals(targetAccountNumber))
                            .collect(Collectors.toList());
                }
                
                if (active != null) {
                    filteredTransfers = filteredTransfers.stream()
                            .filter(transfer -> transfer.isActive() == active)
                            .collect(Collectors.toList());
                }
                
                // Apply pagination manually
                int start = (int) pageable.getOffset();
                int end = Math.min((start + pageable.getPageSize()), filteredTransfers.size());
                
                if (start > filteredTransfers.size()) {
                    start = 0;
                    end = 0;
                }
                
                List<ScheduledTransfer> pageContent = filteredTransfers.subList(start, end);
                pageTransfers = new PageImpl<>(pageContent, pageable, filteredTransfers.size());
            } else {
                // No filters, use standard repository method
                pageTransfers = scheduledTransferRepository.findAll(pageable);
            }
            
            // Convert to DTOs
            List<ScheduledTransferDTO> transfers = pageTransfers.getContent().stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("content", transfers);
            response.put("currentPage", pageTransfers.getNumber());
            response.put("totalElements", pageTransfers.getTotalElements());
            response.put("totalPages", pageTransfers.getTotalPages());
            
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("Error fetching scheduled transfers", e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Get a specific scheduled transfer by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ScheduledTransferDTO> getScheduledTransferById(@PathVariable Long id) {
        logger.info("Fetching scheduled transfer with ID: {}", id);
        
        try {
            ScheduledTransfer transfer = scheduledTransferRepository.findById(id)
                    .orElseThrow(() -> new BusinessException("Scheduled transfer not found with ID: " + id));
            
            return ResponseEntity.ok(convertToDTO(transfer));
        } catch (BusinessException e) {
            logger.error("Scheduled transfer not found with ID: {}", id);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error fetching scheduled transfer with ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Create a new scheduled transfer
     */
    @PostMapping
    public ResponseEntity<ScheduledTransferDTO> createScheduledTransfer(@RequestBody ScheduledTransferDTO transferDTO) {
        logger.info("Creating new scheduled transfer");
        
        try {
            BankAccount sourceAccount = bankAccountRepository.findById(transferDTO.getSourceAccountId())
                    .orElseThrow(() -> new BusinessException("Source account not found with ID: " + transferDTO.getSourceAccountId()));
            
            ScheduledTransfer transfer = new ScheduledTransfer();
            transfer.setAmount(transferDTO.getAmount());
            transfer.setStartDate(transferDTO.getStartDate());
            transfer.setEndDate(transferDTO.getEndDate());
            transfer.setFrequency(transferDTO.getFrequency());
            transfer.setDescription(transferDTO.getDescription());
            transfer.setActive(true);
            transfer.setSourceAccount(sourceAccount);
            transfer.setTargetAccountNumber(transferDTO.getTargetAccountNumber());
            
            // If target account exists in our system, set it
            bankAccountRepository.findByAccountNumber(transferDTO.getTargetAccountNumber())
                .ifPresent(transfer::setTargetAccount);
            
            ScheduledTransfer savedTransfer = scheduledTransferRepository.save(transfer);
            
            return new ResponseEntity<>(convertToDTO(savedTransfer), HttpStatus.CREATED);
        } catch (BusinessException e) {
            logger.error("Error creating scheduled transfer: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Error creating scheduled transfer", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Update an existing scheduled transfer
     */
    @PutMapping("/{id}")
    public ResponseEntity<ScheduledTransferDTO> updateScheduledTransfer(@PathVariable Long id, @RequestBody ScheduledTransferDTO transferDTO) {
        logger.info("Updating scheduled transfer with ID: {}", id);
        
        try {
            ScheduledTransfer existingTransfer = scheduledTransferRepository.findById(id)
                    .orElseThrow(() -> new BusinessException("Scheduled transfer not found with ID: " + id));
            
            // Update transfer fields
            if (transferDTO.getAmount() != null) {
                existingTransfer.setAmount(transferDTO.getAmount());
            }
            
            if (transferDTO.getStartDate() != null) {
                existingTransfer.setStartDate(transferDTO.getStartDate());
            }
            
            if (transferDTO.getEndDate() != null) {
                existingTransfer.setEndDate(transferDTO.getEndDate());
            }
            
            if (transferDTO.getFrequency() != null) {
                existingTransfer.setFrequency(transferDTO.getFrequency());
            }
            
            if (transferDTO.getDescription() != null) {
                existingTransfer.setDescription(transferDTO.getDescription());
            }
            
            existingTransfer.setActive(transferDTO.isActive());
            
            // Update target account if provided
            if (transferDTO.getTargetAccountNumber() != null) {
                existingTransfer.setTargetAccountNumber(transferDTO.getTargetAccountNumber());
                
                // If target account exists in our system, set it
                bankAccountRepository.findByAccountNumber(transferDTO.getTargetAccountNumber())
                    .ifPresent(existingTransfer::setTargetAccount);
            }
            
            // Update source account if provided
            if (transferDTO.getSourceAccountId() != null) {
                BankAccount newSourceAccount = bankAccountRepository.findById(transferDTO.getSourceAccountId())
                        .orElseThrow(() -> new BusinessException("Source account not found with ID: " + transferDTO.getSourceAccountId()));
                existingTransfer.setSourceAccount(newSourceAccount);
            }
            
            ScheduledTransfer updatedTransfer = scheduledTransferRepository.save(existingTransfer);
            
            return ResponseEntity.ok(convertToDTO(updatedTransfer));
        } catch (BusinessException e) {
            logger.error("Error updating scheduled transfer: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Error updating scheduled transfer with ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Delete a scheduled transfer
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteScheduledTransfer(@PathVariable Long id) {
        logger.info("Deleting scheduled transfer with ID: {}", id);
        
        try {
            if (!scheduledTransferRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            scheduledTransferRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            logger.error("Error deleting scheduled transfer with ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Convert entity to DTO
     */
    private ScheduledTransferDTO convertToDTO(ScheduledTransfer transfer) {
        ScheduledTransferDTO dto = new ScheduledTransferDTO();
        dto.setId(transfer.getId());
        dto.setAmount(transfer.getAmount());
        dto.setStartDate(transfer.getStartDate());
        dto.setEndDate(transfer.getEndDate());
        dto.setFrequency(transfer.getFrequency());
        dto.setDescription(transfer.getDescription());
        dto.setActive(transfer.isActive());
        
        if (transfer.getSourceAccount() != null) {
            dto.setSourceAccountId(transfer.getSourceAccount().getId());
            dto.setSourceAccount(transfer.getSourceAccount().getAccountNumber());
        }
        
        // Use targetAccountNumber if available, otherwise get it from targetAccount
        if (transfer.getTargetAccountNumber() != null) {
            dto.setTargetAccountNumber(transfer.getTargetAccountNumber());
        } else if (transfer.getTargetAccount() != null) {
            dto.setTargetAccountNumber(transfer.getTargetAccount().getAccountNumber());
        }
        
        return dto;
    }
} 