package com.devtec.sai.dto;

import com.devtec.sai.model.UserRole;

public record RegisterDTO(String login, String senha, UserRole role) {
}
