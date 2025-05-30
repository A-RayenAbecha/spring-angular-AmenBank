package com.bankamen.dto;

import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class BulkTransferRequest {
    private MultipartFile file;
}
