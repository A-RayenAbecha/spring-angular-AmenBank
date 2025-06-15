package com.bankamen.controller;

import com.bankamen.dto.BankAccountDTO;
import com.bankamen.entity.AccountType;
import com.bankamen.entity.BankAccount;
import com.bankamen.entity.User;
import com.bankamen.exception.BusinessException;
import com.bankamen.repository.BankAccountRepository;
import com.bankamen.repository.UserRepository;
import com.bankamen.service.BankAccountService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
@RequestMapping("/api/admin/accounts")
@PreAuthorize("hasRole('SUPERADMIN')")
public class AdminBankAccountController {
    
    private static final Logger logger = LoggerFactory.getLogger(AdminBankAccountController.class);
    
    @Autowired
    private BankAccountRepository bankAccountRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private BankAccountService bankAccountService;
    
    /**
     * Get all bank accounts with pagination and filtering
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllAccounts(
            @RequestParam(required = false) String iban,
            @RequestParam(required = false) String accountNumber,
            @RequestParam(required = false) AccountType type,
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        
        logger.info("Fetching bank accounts with filters: iban={}, accountNumber={}, type={}, userId={}", 
                iban, accountNumber, type, userId);
        
        try {
            Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
            
            Page<BankAccount> pageAccounts;
            
            // Apply filters
            if (iban != null || accountNumber != null || type != null || userId != null) {
                List<BankAccount> filteredAccounts = bankAccountRepository.findAll();
                
                if (iban != null && !iban.isEmpty()) {
                    filteredAccounts = filteredAccounts.stream()
                            .filter(account -> account.getIban() != null && account.getIban().contains(iban))
                            .collect(Collectors.toList());
                }
                
                if (accountNumber != null && !accountNumber.isEmpty()) {
                    filteredAccounts = filteredAccounts.stream()
                            .filter(account -> account.getAccountNumber() != null && 
                                    account.getAccountNumber().contains(accountNumber))
                            .collect(Collectors.toList());
                }
                
                if (type != null) {
                    filteredAccounts = filteredAccounts.stream()
                            .filter(account -> account.getType() == type)
                            .collect(Collectors.toList());
                }
                
                if (userId != null) {
                    filteredAccounts = filteredAccounts.stream()
                            .filter(account -> account.getUser() != null && 
                                    account.getUser().getId().equals(userId))
                            .collect(Collectors.toList());
                }
                
                // Manual pagination (not efficient for large datasets, but works for demo)
                int start = (int) pageable.getOffset();
                int end = Math.min((start + pageable.getPageSize()), filteredAccounts.size());
                
                if (start > filteredAccounts.size()) {
                    pageAccounts = Page.empty(pageable);
                } else {
                    List<BankAccount> pageContent = filteredAccounts.subList(start, end);
                    pageAccounts = new org.springframework.data.domain.PageImpl<>(
                            pageContent, pageable, filteredAccounts.size());
                }
            } else {
                pageAccounts = bankAccountRepository.findAll(pageable);
            }
            
            List<BankAccountDTO> accounts = pageAccounts.getContent().stream()
                    .map(BankAccountDTO::new)
                    .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("accounts", accounts);
            response.put("currentPage", pageAccounts.getNumber());
            response.put("totalItems", pageAccounts.getTotalElements());
            response.put("totalPages", pageAccounts.getTotalPages());
            
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("Error fetching bank accounts", e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Get a specific bank account by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<BankAccountDTO> getAccountById(@PathVariable Long id) {
        logger.info("Fetching bank account with ID: {}", id);
        
        try {
            BankAccount account = bankAccountRepository.findById(id)
                    .orElseThrow(() -> new BusinessException("Bank account not found with ID: " + id));
            
            return ResponseEntity.ok(new BankAccountDTO(account));
        } catch (BusinessException e) {
            logger.error("Bank account not found with ID: {}", id);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error fetching bank account with ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Create a new bank account
     */
    @PostMapping
    public ResponseEntity<BankAccountDTO> createAccount(@RequestBody BankAccountDTO accountDTO) {
        logger.info("Creating new bank account for user ID: {}", accountDTO.getUserId());
        
        try {
            User user = userRepository.findById(accountDTO.getUserId())
                    .orElseThrow(() -> new BusinessException("User not found with ID: " + accountDTO.getUserId()));
            
            BankAccount account = new BankAccount();
            account.setIban(accountDTO.getIban());
            account.setAccountNumber(accountDTO.getAccountNumber());
            account.setBalance(accountDTO.getBalance() != null ? accountDTO.getBalance() : 0.0);
            account.setType(accountDTO.getType());
            account.setActive(true);
            account.setUser(user);
            
            BankAccount savedAccount = bankAccountRepository.save(account);
            
            return new ResponseEntity<>(new BankAccountDTO(savedAccount), HttpStatus.CREATED);
        } catch (BusinessException e) {
            logger.error("Error creating bank account: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Error creating bank account", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Update an existing bank account
     */
    @PutMapping("/{id}")
    public ResponseEntity<BankAccountDTO> updateAccount(@PathVariable Long id, @RequestBody BankAccountDTO accountDTO) {
        logger.info("Updating bank account with ID: {}", id);
        
        try {
            BankAccount existingAccount = bankAccountRepository.findById(id)
                    .orElseThrow(() -> new BusinessException("Bank account not found with ID: " + id));
            
            // Update account fields
            if (accountDTO.getIban() != null) {
                existingAccount.setIban(accountDTO.getIban());
            }
            
            if (accountDTO.getAccountNumber() != null) {
                existingAccount.setAccountNumber(accountDTO.getAccountNumber());
            }
            
            if (accountDTO.getBalance() != null) {
                existingAccount.setBalance(accountDTO.getBalance());
            }
            
            if (accountDTO.getType() != null) {
                existingAccount.setType(accountDTO.getType());
            }
            
            existingAccount.setActive(accountDTO.isActive());
            
            // Update user if provided
            if (accountDTO.getUserId() != null && 
                    (existingAccount.getUser() == null || !existingAccount.getUser().getId().equals(accountDTO.getUserId()))) {
                User newUser = userRepository.findById(accountDTO.getUserId())
                        .orElseThrow(() -> new BusinessException("User not found with ID: " + accountDTO.getUserId()));
                existingAccount.setUser(newUser);
            }
            
            BankAccount updatedAccount = bankAccountRepository.save(existingAccount);
            
            return ResponseEntity.ok(new BankAccountDTO(updatedAccount));
        } catch (BusinessException e) {
            logger.error("Error updating bank account: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Error updating bank account with ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Delete a bank account
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccount(@PathVariable Long id) {
        logger.info("Deleting bank account with ID: {}", id);
        
        try {
            if (!bankAccountRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            bankAccountRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            logger.error("Error deleting bank account with ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get account types for dropdown
     */
    @GetMapping("/types")
    public ResponseEntity<AccountType[]> getAccountTypes() {
        return ResponseEntity.ok(AccountType.values());
    }
    
    /**
     * Search users for account assignment
     */
    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> searchUsers(@RequestParam String query) {
        logger.info("Searching users with query: {}", query);
        
        try {
            List<User> users = userRepository.findAll();
            
            // Filter users by name or username containing the query
            List<Map<String, Object>> results = users.stream()
                    .filter(user -> 
                        (user.getUsername() != null && user.getUsername().toLowerCase().contains(query.toLowerCase())) ||
                        (user.getFirstName() != null && user.getFirstName().toLowerCase().contains(query.toLowerCase())) ||
                        (user.getLastName() != null && user.getLastName().toLowerCase().contains(query.toLowerCase()))
                    )
                    .map(user -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", user.getId());
                        map.put("username", user.getUsername());
                        map.put("name", user.getFirstName() + " " + user.getLastName());
                        return map;
                    })
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            logger.error("Error searching users", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
} 