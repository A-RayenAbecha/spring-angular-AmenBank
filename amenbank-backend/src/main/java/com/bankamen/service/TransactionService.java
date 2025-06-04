package com.bankamen.service;

import com.bankamen.dto.CreateTransactionRequest;
import com.bankamen.dto.TransactionFilterRequest;
import com.bankamen.entity.BankAccount;
import com.bankamen.entity.Transaction;
import com.bankamen.entity.TransactionType;
import com.bankamen.entity.User;
import com.bankamen.exception.BusinessException;
import com.bankamen.repository.BankAccountRepository;
import com.bankamen.repository.TransactionRepository;
import com.bankamen.repository.UserRepository;
import com.bankamen.specification.TransactionSpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import com.opencsv.CSVReader;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.util.List;

import static com.bankamen.entity.TransactionType.*;

@Service
public class TransactionService {
    @Autowired
    private TransactionRepository transactionRepo;
    @Autowired
    private BankAccountRepository accountRepo ;
    @Autowired
    private UserRepository userRepository;

    public List<Transaction> getTransactions(Long accountId) {
        return transactionRepo.findByAccountId(accountId);
    }

    public List<Transaction> getFilteredTransactions(Long accountId, TransactionType type, LocalDateTime from, LocalDateTime to, Double minAmount, Double maxAmount) {
        if (type != null) {
            return transactionRepo.findByAccountIdAndType(accountId, type);
        } else if (from != null && to != null) {
            return transactionRepo.findByAccountIdAndDateBetween(accountId, from, to);
        } else if (minAmount != null && maxAmount != null) {
            return transactionRepo.findByAccountIdAndAmountBetween(accountId, minAmount, maxAmount);
        }
        return transactionRepo.findByAccountId(accountId);
    }

    public Transaction createTransaction(Long accountId, CreateTransactionRequest request) {
        BankAccount sourceAccount = accountRepo.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Compte source introuvable"));

        Transaction transaction = new Transaction();
        transaction.setAmount(request.getAmount());
        transaction.setType(request.getType());
        transaction.setDescription(request.getDescription());
        transaction.setDate(LocalDateTime.now());

        switch (request.getType()) {
            case DEPOSIT -> {
                sourceAccount.setBalance(sourceAccount.getBalance() + request.getAmount());
                transaction.setBalanceAfter(sourceAccount.getBalance());
                transaction.setAccount(sourceAccount);
            }

            case WITHDRAWAL -> {
                if (sourceAccount.getBalance() < request.getAmount()) {
                    throw new BusinessException("Fonds insuffisants pour le retrait");
                }
                sourceAccount.setBalance(sourceAccount.getBalance() - request.getAmount());
                transaction.setBalanceAfter(sourceAccount.getBalance());
                transaction.setAccount(sourceAccount);
            }

            case TRANSFER -> {
                if (sourceAccount.getBalance() < request.getAmount()) {
                    throw new BusinessException("Fonds insuffisants pour le retrait");
                }

                BankAccount targetAccount = accountRepo.findById(request.getTargetAccountId())
                        .orElseThrow(() -> new BusinessException("Compte destinataire introuvable"));

                // Débit du compte source
                sourceAccount.setBalance(sourceAccount.getBalance() - request.getAmount());

                // Crédit du compte cible
                targetAccount.setBalance(targetAccount.getBalance() + request.getAmount());

                // Sauvegarde des deux comptes
                accountRepo.save(targetAccount);

                transaction.setDescription("Transfert vers compte de : " + targetAccount.getUser().getUsername());
                transaction.setBalanceAfter(sourceAccount.getBalance());
                transaction.setAccount(sourceAccount);
            }
        }

        accountRepo.save(sourceAccount);
        return transactionRepo.save(transaction);
    }

    public List<Transaction> getFilteredTransactions(TransactionFilterRequest filterRequest) {
        Specification<Transaction> spec = TransactionSpecification.filterByCriteria(filterRequest);
        return transactionRepo.findAll(spec);
    }

    public void processBulkTransfers(MultipartFile file) {
        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {
            String[] line;
            reader.readNext(); // Skip header

            while ((line = reader.readNext()) != null) {
                Long sourceId = Long.parseLong(line[0]);
                Long targetId = Long.parseLong(line[1]);
                Double amount = Double.parseDouble(line[2]);
                String description = line[3];

                CreateTransactionRequest request = new CreateTransactionRequest();
                request.setType(TransactionType.TRANSFER);
                request.setAmount(amount);
                request.setTargetAccountId(targetId);
                request.setDescription(description);

                createTransaction(sourceId, request); // Reuse your existing logic
            }

        } catch (Exception e) {
            throw new BusinessException("Erreur lors de l'import du fichier CSV: " + e.getMessage());
        }
    }

    public List<Transaction> getFilteredTransactionsForUser(TransactionFilterRequest filterRequest, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable"));

        // Use the regular filterByCriteria method and filter by user accounts
        Specification<Transaction> spec = TransactionSpecification.filterByCriteria(filterRequest);

        // Get all user's accounts
        List<BankAccount> userAccounts = accountRepo.findByUserId(user.getId());
        List<Long> accountIds = userAccounts.stream().map(BankAccount::getId).toList();

        // Add account filtering to the specification
        Specification<Transaction> accountSpec = (root, query, criteriaBuilder) ->
                root.get("account").get("id").in(accountIds);

        spec = spec.and(accountSpec);

        return transactionRepo.findAll(spec);
    }

    public void processBulkTransfersForUser(MultipartFile file, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable"));

        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {
            String[] line;
            reader.readNext(); // Skip header

            while ((line = reader.readNext()) != null) {
                Long sourceId = Long.parseLong(line[0]);
                Long targetId = Long.parseLong(line[1]);
                Double amount = Double.parseDouble(line[2]);
                String description = line[3];

                // Check if user owns the source account
                if (!userOwnsAccount(sourceId, username)) {
                    throw new BusinessException("Compte source non autorisé");
                }

                CreateTransactionRequest request = new CreateTransactionRequest();
                request.setType(TransactionType.TRANSFER);
                request.setAmount(amount);
                request.setTargetAccountId(targetId);
                request.setDescription(description);

                createTransaction(sourceId, request);
            }

        } catch (Exception e) {
            throw new BusinessException("Erreur lors de l'import du fichier CSV: " + e.getMessage());
        }
    }

    /**
     * Check if a user owns a specific bank account
     * @param accountId The account ID to check
     * @param username The username to verify ownership
     * @return true if the user owns the account, false otherwise
     */
    private boolean userOwnsAccount(Long accountId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable"));

        BankAccount account = accountRepo.findById(accountId)
                .orElseThrow(() -> new BusinessException("Compte introuvable"));

        return account.getUser().getId().equals(user.getId());
    }
}