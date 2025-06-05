package com.bankamen.service;

import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.bankamen.dto.CreateTransactionRequest;
import com.bankamen.dto.TransactionFilterRequest;
import com.bankamen.entity.BankAccount;
import com.bankamen.entity.Transaction;
import com.bankamen.entity.TransactionType;
import static com.bankamen.entity.TransactionType.DEPOSIT;
import static com.bankamen.entity.TransactionType.TRANSFER;
import static com.bankamen.entity.TransactionType.WITHDRAWAL;
import com.bankamen.entity.User;
import com.bankamen.exception.BusinessException;
import com.bankamen.repository.BankAccountRepository;
import com.bankamen.repository.TransactionRepository;
import com.bankamen.repository.UserRepository;
import com.bankamen.specification.TransactionSpecification;
import com.opencsv.CSVReader;

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
            int lineNumber = 1;

            while ((line = reader.readNext()) != null) {
                lineNumber++;
                try {
                    if (line.length < 4) {
                        throw new BusinessException("La ligne " + lineNumber + " ne contient pas assez de colonnes. Format attendu: ID Source, ID Destination, Montant, Description");
                    }

                    Long sourceId = parseLong(line[0], "ID Source", lineNumber);
                    Long targetId = parseLong(line[1], "ID Destination", lineNumber);
                    Double amount = parseDouble(line[2], "Montant", lineNumber);
                    String description = line[3];

                    if (description == null || description.trim().isEmpty()) {
                        throw new BusinessException("La description est requise à la ligne " + lineNumber);
                    }

                    CreateTransactionRequest request = new CreateTransactionRequest();
                    request.setType(TransactionType.TRANSFER);
                    request.setAmount(amount);
                    request.setTargetAccountId(targetId);
                    request.setDescription(description);

                    createTransaction(sourceId, request);
                } catch (BusinessException e) {
                    throw new BusinessException("Erreur à la ligne " + lineNumber + ": " + e.getMessage());
                }
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException("Erreur lors de l'import du fichier CSV: " + e.getMessage());
        }
    }

    private Long parseLong(String value, String field, int lineNumber) {
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException e) {
            throw new BusinessException("La valeur '" + value + "' pour le champ '" + field + "' à la ligne " + lineNumber + " n'est pas un nombre valide");
        }
    }

    private Double parseDouble(String value, String field, int lineNumber) {
        try {
            return Double.parseDouble(value.trim());
        } catch (NumberFormatException e) {
            throw new BusinessException("La valeur '" + value + "' pour le champ '" + field + "' à la ligne " + lineNumber + " n'est pas un montant valide");
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

        if (file.isEmpty()) {
            throw new BusinessException("Le fichier CSV est vide");
        }

        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {
            String[] line;
            String[] headers = reader.readNext(); // Read header
            
            if (headers == null || headers.length < 4) {
                throw new BusinessException("Le format du fichier CSV est invalide. Format attendu: ID Source, ID Destination, Montant, Description");
            }

            int lineNumber = 1;
            int successCount = 0;

            while ((line = reader.readNext()) != null) {
                lineNumber++;
                try {
                    if (line.length < 4) {
                        throw new BusinessException("La ligne " + lineNumber + " ne contient pas assez de colonnes. Format attendu: ID Source, ID Destination, Montant, Description");
                    }

                    Long sourceId = parseLong(line[0], "ID Source", lineNumber);
                    Long targetId = parseLong(line[1], "ID Destination", lineNumber);
                    Double amount = parseDouble(line[2], "Montant", lineNumber);
                    String description = line[3];

                    if (description == null || description.trim().isEmpty()) {
                        throw new BusinessException("La description est requise à la ligne " + lineNumber);
                    }

                    // Check if user owns the source account
                    if (!userOwnsAccount(sourceId, username)) {
                        throw new BusinessException("Vous n'êtes pas autorisé à effectuer des transactions depuis le compte " + sourceId);
                    }

                    CreateTransactionRequest request = new CreateTransactionRequest();
                    request.setType(TransactionType.TRANSFER);
                    request.setAmount(amount);
                    request.setTargetAccountId(targetId);
                    request.setDescription(description);

                    createTransaction(sourceId, request);
                    successCount++;
                } catch (BusinessException e) {
                    throw new BusinessException("Erreur à la ligne " + lineNumber + ": " + e.getMessage());
                }
            }

            if (successCount == 0) {
                throw new BusinessException("Aucune transaction n'a été effectuée");
            }
            
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            if (e.getMessage() != null && !e.getMessage().isEmpty()) {
                throw new BusinessException("Erreur lors de l'import du fichier CSV: " + e.getMessage());
            } else {
                throw new BusinessException("Erreur lors de l'import du fichier CSV: Format invalide");
            }
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