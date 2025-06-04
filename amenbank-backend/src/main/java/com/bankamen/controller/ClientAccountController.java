package com.bankamen.controller;

import com.bankamen.dto.BankAccountDTO;
import com.bankamen.dto.CreateTransactionRequest;
import com.bankamen.dto.TransactionDTO;
import com.bankamen.dto.TransactionFilterRequest;
import com.bankamen.entity.BankAccount;
import com.bankamen.entity.Transaction;
import com.bankamen.entity.TransactionType;
import com.bankamen.entity.User;
import com.bankamen.service.BankAccountService;
import com.bankamen.service.TransactionService;
import com.bankamen.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/client")
public class ClientAccountController {

    @Autowired
    private BankAccountService accountService;

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private UserService userService;

    // Get current user's accounts
    @GetMapping("/accounts")
    public ResponseEntity<List<BankAccountDTO>> getCurrentUserAccounts() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        User currentUser = userService.findByUsername(username);

        List<BankAccount> accounts = accountService.getAccountsByUser(currentUser.getId());
        List<BankAccountDTO> dtos = accounts.stream()
                .map(BankAccountDTO::new)
                .toList();

        return ResponseEntity.ok(dtos);
    }

    // Get specific user accounts (admin only or user accessing their own data)
    @GetMapping("/accounts/{userId}")
    public ResponseEntity<List<BankAccountDTO>> getUserAccounts(@PathVariable Long userId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        User currentUser = userService.findByUsername(username);

        // Allow access only if user is accessing their own data or is admin
        if (!currentUser.getId().equals(userId) && !currentUser.getRole().name().equals("SUPERADMIN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<BankAccount> accounts = accountService.getAccountsByUser(userId);
        List<BankAccountDTO> dtos = accounts.stream()
                .map(BankAccountDTO::new)
                .toList();

        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/accounts/{accountId}/transactions")
    public ResponseEntity<List<TransactionDTO>> getTransactions(
            @PathVariable Long accountId,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) Double min,
            @RequestParam(required = false) Double max) {

        // Validate user owns this account
        if (!accountService.userOwnsAccount(accountId, getCurrentUsername())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<Transaction> filtered = transactionService.getFilteredTransactions(accountId, type, from, to, min, max);
        List<TransactionDTO> dtos = filtered.stream()
                .map(TransactionDTO::new)
                .toList();

        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/accounts")
    public ResponseEntity<BankAccount> createAccount(@RequestBody BankAccount account) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        User currentUser = userService.findByUsername(username);

        return ResponseEntity.ok(accountService.createAccount(account, currentUser.getId()));
    }

    @PostMapping("/accounts/{accountId}/transactions")
    public ResponseEntity<TransactionDTO> createTransaction(
            @PathVariable Long accountId,
            @RequestBody CreateTransactionRequest request) {

        // Validate user owns this account
        if (!accountService.userOwnsAccount(accountId, getCurrentUsername())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Transaction transaction = transactionService.createTransaction(accountId, request);
        TransactionDTO dto = new TransactionDTO(transaction);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @PostMapping("/transactions/filter")
    public ResponseEntity<List<TransactionDTO>> filterTransactions(@RequestBody TransactionFilterRequest request) {
        // Add user filtering to ensure users only see their own transactions
        List<Transaction> transactions = transactionService.getFilteredTransactionsForUser(request, getCurrentUsername());
        List<TransactionDTO> dtos = transactions.stream()
                .map(TransactionDTO::new)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/transactions/import-csv")
    public ResponseEntity<String> importBulkTransfers(@RequestParam("file") MultipartFile file) {
        transactionService.processBulkTransfersForUser(file, getCurrentUsername());
        return ResponseEntity.ok("Transferts groupés traités avec succès");
    }

    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName();
    }
}