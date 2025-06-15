package com.bankamen.service;

import com.bankamen.dto.LoanApplicationRequest;
import com.bankamen.dto.LoanApplicationResponse;
import com.bankamen.entity.BankAccount;
import com.bankamen.entity.LoanApplication;
import com.bankamen.entity.LoanStatus;
import com.bankamen.exception.BusinessException;
import com.bankamen.repository.AdminLoanRepository;
import com.bankamen.repository.BankAccountRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminLoanService {
    private static final Logger logger = LoggerFactory.getLogger(AdminLoanService.class);

    @Autowired
    private AdminLoanRepository adminLoanRepository;
    
    @Autowired
    private BankAccountRepository bankAccountRepository;

    /**
     * Get all loan applications
     */
    public List<LoanApplicationResponse> getAllLoanApplications() {
        logger.info("Getting all loan applications");
        try {
            List<LoanApplication> applications = adminLoanRepository.findAll();
            logger.info("Found {} loan applications", applications.size());
            List<LoanApplicationResponse> responses = applications.stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
            logger.info("Mapped {} loan applications to responses", responses.size());
            return responses;
        } catch (Exception e) {
            logger.error("Error getting all loan applications", e);
            throw e;
        }
    }

    /**
     * Get loan applications by status
     */
    public List<LoanApplicationResponse> getLoanApplicationsByStatus(LoanStatus status) {
        return adminLoanRepository.findByStatus(status).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get a loan application by ID
     */
    public LoanApplicationResponse getLoanApplicationById(Long id) {
        LoanApplication application = adminLoanRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Loan application not found with ID: " + id));
        return mapToResponse(application);
    }

    /**
     * Create a new loan application for a user
     */
    @Transactional
    public LoanApplicationResponse createLoanApplication(LoanApplicationRequest request) {
        BankAccount account = bankAccountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new BusinessException("Bank account not found with ID: " + request.getAccountId()));

        LoanApplication loanApplication = new LoanApplication();
        loanApplication.setAmount(request.getAmount());
        loanApplication.setTermInMonths(request.getTermInMonths());
        loanApplication.setInterestRate(request.getInterestRate());
        loanApplication.setStatus(LoanStatus.PENDING);
        loanApplication.setRequestDate(LocalDate.now());
        loanApplication.setAccount(account);

        LoanApplication savedLoan = adminLoanRepository.save(loanApplication);
        return mapToResponse(savedLoan);
    }

    /**
     * Update an existing loan application
     */
    @Transactional
    public LoanApplicationResponse updateLoanApplication(Long id, LoanApplicationRequest request) {
        LoanApplication loanApplication = adminLoanRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Loan application not found with ID: " + id));

        if (request.getAccountId() != null && !request.getAccountId().equals(loanApplication.getAccount().getId())) {
            BankAccount newAccount = bankAccountRepository.findById(request.getAccountId())
                    .orElseThrow(() -> new BusinessException("Bank account not found with ID: " + request.getAccountId()));
            loanApplication.setAccount(newAccount);
        }

        if (request.getAmount() != null) {
            loanApplication.setAmount(request.getAmount());
        }
        
        if (request.getTermInMonths() != null) {
            loanApplication.setTermInMonths(request.getTermInMonths());
        }
        
        if (request.getInterestRate() != null) {
            loanApplication.setInterestRate(request.getInterestRate());
        }

        LoanApplication updatedLoan = adminLoanRepository.save(loanApplication);
        return mapToResponse(updatedLoan);
    }

    /**
     * Update the status of a loan application
     */
    @Transactional
    public LoanApplicationResponse updateLoanStatus(Long id, LoanStatus status) {
        LoanApplication loanApplication = adminLoanRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Loan application not found with ID: " + id));
        
        loanApplication.setStatus(status);
        LoanApplication updatedLoan = adminLoanRepository.save(loanApplication);
        return mapToResponse(updatedLoan);
    }

    /**
     * Delete a loan application
     */
    @Transactional
    public void deleteLoanApplication(Long id) {
        if (!adminLoanRepository.existsById(id)) {
            throw new BusinessException("Loan application not found with ID: " + id);
        }
        adminLoanRepository.deleteById(id);
    }

    /**
     * Map a LoanApplication entity to a LoanApplicationResponse DTO
     */
    private LoanApplicationResponse mapToResponse(LoanApplication loan) {
        LoanApplicationResponse response = new LoanApplicationResponse();
        response.setId(loan.getId());
        response.setAmount(loan.getAmount());
        response.setTermInMonths(loan.getTermInMonths());
        response.setInterestRate(loan.getInterestRate());
        response.setStatus(loan.getStatus());
        response.setAccountId(loan.getAccount().getId());
        return response;
    }
} 