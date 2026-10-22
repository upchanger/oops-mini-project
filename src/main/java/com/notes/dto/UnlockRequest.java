package com.notes.dto;

import jakarta.validation.constraints.NotBlank;

public class UnlockRequest {

    @NotBlank(message = "PIN is required")
    private String pin;

    public UnlockRequest() {
    }

    public UnlockRequest(String pin) {
        this.pin = pin;
    }

    public String getPin() {
        return pin;
    }

    public void setPin(String pin) {
        this.pin = pin;
    }
}
