package com.bankamen.controller;

import com.bankamen.dto.LoanApplicationRequest;
import com.bankamen.dto.LoanApplicationResponse;
import com.bankamen.dto.LoanSimulationRequest;
import com.bankamen.dto.LoanSimulationResponse;
import com.bankamen.entity.LoanApplication;
import com.bankamen.service.LoanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/client/loans")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;

    @PostMapping("/simulate")
    public ResponseEntity<LoanSimulationResponse> simulate(@RequestBody LoanSimulationRequest request) {
        return ResponseEntity.ok(loanService.simulateLoan(request));
    }

    @PostMapping("/apply")
    public ResponseEntity<LoanApplicationResponse> apply(@RequestBody LoanApplicationRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String username = auth.getName();
        LoanApplication loan = loanService.submitLoanRequest(request, username);

        LoanApplicationResponse response = new LoanApplicationResponse();
        response.setId(loan.getId());
        response.setAmount(loan.getAmount());
        response.setTermInMonths(loan.getTermInMonths());
        response.setInterestRate(loan.getInterestRate());
        response.setStatus(loan.getStatus());
        response.setAccountId(loan.getAccount().getId());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-applications")
    public ResponseEntity<List<LoanApplicationResponse>> getMyLoanApplications() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        List<LoanApplication> applications = loanService.getUserLoanApplications(username);
        List<LoanApplicationResponse> responses = applications.stream()
                .map(this::mapToResponse)
                .toList();

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/applications/{id}")
    public ResponseEntity<LoanApplicationResponse> getLoanApplication(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        LoanApplication application = loanService.getUserLoanApplication(id, username);
        if (application == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(mapToResponse(application));
    }

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