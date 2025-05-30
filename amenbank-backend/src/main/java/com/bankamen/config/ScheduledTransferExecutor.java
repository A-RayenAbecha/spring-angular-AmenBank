package com.bankamen.config;

import com.bankamen.entity.ScheduledTransfer;
import com.bankamen.repository.ScheduledTransferRepository;
import com.bankamen.service.ScheduledTransferService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ScheduledTransferExecutor {

    private final ScheduledTransferService transferService;

    @Autowired
    ScheduledTransferRepository scheduledTransferRepo;

    // Cette méthode sera exécutée automatiquement chaque jour à 07:00
    @Scheduled(cron = "0 0 7 * * *") // Tous les jours à 07h
    public void sendPreExecutionAlerts() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);

        List<ScheduledTransfer> transfers = scheduledTransferRepo.findByActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqual(tomorrow, tomorrow);

        for (ScheduledTransfer transfer : transfers) {
            System.out.println("🔔 Rappel : Virement programmé demain vers " +
                    transfer.getTargetAccount().getId() + " pour " + transfer.getAmount() + " €");
        }
    }

}
