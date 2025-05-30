package com.bankamen.dto;

import jakarta.validation.constraints.NotBlank;

public class TwoFactorRequest {
    @NotBlank
    private String username;

    @NotBlank
    private String token;

    // getters/setters
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}

