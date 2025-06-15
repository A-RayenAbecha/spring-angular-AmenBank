package com.bankamen.dto;


public class LoginResponse {
    private String message;
    private boolean twoFactorRequired;

    public LoginResponse(String message, boolean twoFactorRequired) {
        this.message = message;
        this.twoFactorRequired = twoFactorRequired;
    }

    // getters and setters
    public String getMessage() {
        return message;
    }

    public boolean isTwoFactorRequired() {
        return twoFactorRequired;
    }
}
