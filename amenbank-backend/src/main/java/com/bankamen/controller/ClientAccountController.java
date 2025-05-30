package com.bankamen.controller;

import com.bankamen.dto.BankAccountDTO;
import com.bankamen.dto.CreateTransactionRequest;
import com.bankamen.dto.TransactionFilterRequest;
import com.bankamen.entity.BankAccount;
import com.bankamen.entity.Transaction;
import com.bankamen.entity.TransactionType;
import com.bankamen.service.BankAccountService;
import com.bankamen.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/client/accounts")
public class ClientAccountController {

    @Autowired
    private BankAccountService accountService;

    @Autowired
    private TransactionService transactionService;

    @GetMapping("/{userId}")
    public ResponseEntity<List<BankAccountDTO>> getUserAccounts(@PathVariable Long userId) {
        List<BankAccount> accounts = accountService.getAccountsByUser(userId);
        List<BankAccountDTO> dtos = accounts.stream()
                .map(BankAccountDTO::new)
                .toList();

        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{accountId}/transactions")
    public ResponseEntity<List<Transaction>> getTransactions(
            @PathVariable Long accountId,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) Double min,
            @RequestParam(required = false) Double max) {

        List<Transaction> filtered = transactionService.getFilteredTransactions(accountId, type, from, to, min, max);
        return ResponseEntity.ok(filtered);
    }

    @PostMapping("/create/{userId}")
    public ResponseEntity<BankAccount> createAccount(@PathVariable Long userId, @RequestBody BankAccount account) {
        return ResponseEntity.ok(accountService.createAccount(account, userId));
    }
    @PostMapping("/{accountId}/transactions")
    public ResponseEntity<Transaction> createTransaction(
            @PathVariable Long accountId,
            @RequestBody CreateTransactionRequest request) {

        Transaction transaction = transactionService.createTransaction(accountId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(transaction);
    }
    @PostMapping("/filter")
    public ResponseEntity<List<Transaction>> filterTransactions(@RequestBody TransactionFilterRequest request) {
        List<Transaction> transactions = transactionService.getFilteredTransactions(request);
        return ResponseEntity.ok(transactions);
    }
    @PostMapping("/transactions/import-csv")
    public ResponseEntity<String> importBulkTransfers(@RequestParam("file") MultipartFile file) {
        transactionService.processBulkTransfers(file);
        return ResponseEntity.ok("Transferts groupés traités avec succès");
    }

}

