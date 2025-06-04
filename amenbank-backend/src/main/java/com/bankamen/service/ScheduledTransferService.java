package com.bankamen.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.bankamen.dto.ScheduledTransferRequest;
import com.bankamen.dto.ScheduledTransferResponse;
import com.bankamen.dto.ScheduledTransferUpdateRequest;
import com.bankamen.entity.BankAccount;
import com.bankamen.entity.ScheduledTransfer;
import com.bankamen.entity.Transaction;
import com.bankamen.entity.TransactionType;
import com.bankamen.exception.BusinessException;
import com.bankamen.repository.BankAccountRepository;
import com.bankamen.repository.ScheduledTransferRepository;
import com.bankamen.repository.TransactionRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ScheduledTransferService {

    private final ScheduledTransferRepository scheduledTransferRepo;
    private final BankAccountRepository accountRepo;
    private final TransactionRepository transactionRepo;
    private final NotificationService notificationService;
    private static final Logger logger = LoggerFactory.getLogger(ScheduledTransferService.class);


    public ScheduledTransfer createScheduledTransfer(ScheduledTransferRequest request) {
        BankAccount source = accountRepo.findById(request.getSourceAccountId())
                .orElseThrow(() -> new BusinessException("Compte source introuvable"));
        
        // Find target account by account number
        BankAccount target = accountRepo.findByAccountNumber(request.getTargetAccountNumber())
                .orElseThrow(() -> new BusinessException("Compte destinataire introuvable"));

        ScheduledTransfer transfer = new ScheduledTransfer();
        transfer.setAmount(request.getAmount());
        transfer.setStartDate(request.getStartDate());
        transfer.setEndDate(request.getEndDate());
        transfer.setFrequency(request.getFrequency());
        transfer.setDescription(request.getDescription());
        transfer.setSourceAccount(source);
        transfer.setTargetAccount(target);
        transfer.setActive(true);

        transfer = scheduledTransferRepo.save(transfer);

        // Create reminder for the first execution
        LocalDateTime nextExecution = calculateNextExecutionDate(transfer);
        if (nextExecution != null) {
            notificationService.createReminderNotification(transfer, nextExecution);
        }

        return transfer;
    }

    private LocalDateTime calculateNextExecutionDate(ScheduledTransfer transfer) {
        LocalDate today = LocalDate.now();
        LocalDate startDate = transfer.getStartDate();
        
        if (startDate.isBefore(today)) {
            startDate = today;
        }

        return switch (transfer.getFrequency()) {
            case DAILY -> startDate.atTime(8, 0); // Execute at 8:00 AM
            case WEEKLY -> {
                LocalDate next = startDate;
                while (next.isBefore(today)) {
                    next = next.plusWeeks(1);
                }
                yield next.atTime(8, 0);
            }
            case MONTHLY -> {
                LocalDate next = startDate;
                while (next.isBefore(today)) {
                    next = next.plusMonths(1);
                }
                yield next.atTime(8, 0);
            }
        };
    }

    public List<ScheduledTransfer> getAllActiveTransfers() {
        LocalDate today = LocalDate.now();
        return scheduledTransferRepo.findByActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqual(today, today);
    }

    @Transactional
    public int executeScheduledTransfers() {
        LocalDate today = LocalDate.now();
        List<ScheduledTransfer> transfers = getAllActiveTransfers();

        int executedCount = 0;
        for (ScheduledTransfer transfer : transfers) {
            if (shouldExecuteToday(transfer, today)) {
                try {
                    boolean success = performTransfer(transfer);
                    if (success) {
                        executedCount++;
                        // Create execution notification
                        notificationService.createExecutionNotification(transfer);
                        
                        // Create reminder for next execution
                        LocalDateTime nextExecution = calculateNextExecutionDate(transfer);
                        if (nextExecution != null) {
                            notificationService.createReminderNotification(transfer, nextExecution);
                        }
                    }
                } catch (Exception e) {
                    logger.error("Erreur virement programmé ID " + transfer.getId() + " : " + e.getMessage());
                }
            }
        }
        return executedCount;
    }

    private boolean shouldExecuteToday(ScheduledTransfer transfer, LocalDate today) {
        return switch (transfer.getFrequency()) {
            case DAILY -> true;
            case WEEKLY -> today.getDayOfWeek() == transfer.getStartDate().getDayOfWeek();
            case MONTHLY -> today.getDayOfMonth() == transfer.getStartDate().getDayOfMonth();
        };
    }

    /**
     * Retourne true si le transfert a été effectué, false sinon (ex: solde insuffisant)
     */
    private boolean performTransfer(ScheduledTransfer transfer) {
        BankAccount source = transfer.getSourceAccount();
        BankAccount target = transfer.getTargetAccount();
        double amount = transfer.getAmount();

        if (source.getBalance() < amount) {
            logger.warn("❌ Virement échoué: Solde insuffisant pour le compte source ID {}. Montant requis: {}, Solde actuel: {}",
                    source.getId(), amount, source.getBalance());
            return false;
        }

        source.setBalance(source.getBalance() - amount);
        target.setBalance(target.getBalance() + amount);

        accountRepo.save(source);
        accountRepo.save(target);

        Transaction tx = new Transaction();
        tx.setAccount(source);
        tx.setAmount(amount);
        tx.setDate(LocalDateTime.now());
        tx.setType(TransactionType.TRANSFER);
        tx.setDescription("Virement programmé vers compte ID: " + target.getId());
        tx.setBalanceAfter(source.getBalance());

        transactionRepo.save(tx);

        logger.info("✅ Virement exécuté avec succès (ScheduledTransfer ID: {}) - Montant: {}, Source: {}, Cible: {}",
                transfer.getId(), amount, source.getId(), target.getId());

        return true;
    }

    /**
     * Retourne true si annulation réussie, false sinon
     */
    public boolean cancelScheduledTransfer(Long id) {
        return scheduledTransferRepo.findById(id)
                .map(transfer -> {
                    if (!transfer.isActive()) return false;
                    transfer.setActive(false);
                    scheduledTransferRepo.save(transfer);
                    return true;
                })
                .orElse(false);
    }

    public ScheduledTransferResponse mapToResponse(ScheduledTransfer transfer) {
        ScheduledTransferResponse response = new ScheduledTransferResponse();
        response.setId(transfer.getId());
        response.setAmount(transfer.getAmount());
        response.setStartDate(transfer.getStartDate());
        response.setEndDate(transfer.getEndDate());
        response.setFrequency(transfer.getFrequency());
        response.setDescription(transfer.getDescription());
        response.setActive(transfer.isActive());
        response.setSourceAccountId(transfer.getSourceAccount().getId());
        response.setTargetAccountId(transfer.getTargetAccount().getId());
        return response;
    }
    public ScheduledTransferResponse updateScheduledTransfer(Long id, ScheduledTransferUpdateRequest request) {
        ScheduledTransfer transfer = scheduledTransferRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Virement récurrent introuvable"));

        transfer.setAmount(request.getAmount());
        transfer.setStartDate(request.getStartDate());
        transfer.setEndDate(request.getEndDate());
        transfer.setFrequency(request.getFrequency());
        transfer.setDescription(request.getDescription());
        transfer.setActive(request.isActive());

        ScheduledTransfer updated = scheduledTransferRepo.save(transfer);
        return mapToResponse(updated);
    }

}

