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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/loans")
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

        String username = auth.getName();  // ✅ Always safe, even with custom authentication

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

}
