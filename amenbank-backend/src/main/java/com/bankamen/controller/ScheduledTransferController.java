package com.bankamen.controller;

import com.bankamen.dto.ScheduledTransferRequest;
import com.bankamen.dto.ScheduledTransferResponse;
import com.bankamen.dto.ScheduledTransferUpdateRequest;
import com.bankamen.entity.ScheduledTransfer;
import com.bankamen.service.ScheduledTransferService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/scheduled-transfers")
@RequiredArgsConstructor
public class ScheduledTransferController {

    private final ScheduledTransferService service;

    @PostMapping
    public ResponseEntity<ScheduledTransferResponse> createScheduledTransfer(@RequestBody ScheduledTransferRequest request) {
        ScheduledTransfer transfer = service.createScheduledTransfer(request);
        return ResponseEntity.ok(service.mapToResponse(transfer));
    }

    @GetMapping("/active")
    public ResponseEntity<List<ScheduledTransferResponse>> getActive() {
        List<ScheduledTransfer> transfers = service.getAllActiveTransfers();
        List<ScheduledTransferResponse> responseList = transfers.stream()
                .map(service::mapToResponse)
                .toList();
        return ResponseEntity.ok(responseList);
    }


    @PostMapping("/execute")
    public ResponseEntity<String> executeNow() {
        try {
            int count = service.executeScheduledTransfers();
            return ResponseEntity.ok("Nombre de virements exécutés : " + count);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de l'exécution : " + e.getMessage());
        }
    }

    @PutMapping("/cancel/{id}")
    public ResponseEntity<String> cancel(@PathVariable Long id) {
        try {
            boolean canceled = service.cancelScheduledTransfer(id);
            if (canceled) {
                return ResponseEntity.ok("Virement programmé annulé avec succès, ID : " + id);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Virement programmé non trouvé ou déjà annulé, ID : " + id);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de l'annulation : " + e.getMessage());
        }
    }
    @PutMapping("/update/{id}")
    public ResponseEntity<Map<String, Object>> update(@PathVariable Long id,
                                                      @RequestBody ScheduledTransferUpdateRequest request) {
        try {
            ScheduledTransferResponse response = service.updateScheduledTransfer(id, request);
            Map<String, Object> result = new HashMap<>();
            result.put("message", "✅ Virement récurrent mis à jour avec succès");
            result.put("transfer", response);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", "❌ Échec de la mise à jour du virement récurrent");
            error.put("error", e.getMessage());
            return ResponseEntity.status(404).body(error);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", "❌ Erreur interne lors de la mise à jour");
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }



}

