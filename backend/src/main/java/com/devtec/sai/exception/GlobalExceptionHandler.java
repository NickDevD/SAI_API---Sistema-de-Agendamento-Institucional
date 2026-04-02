package com.devtec.sai.exception;

import com.devtec.sai.dto.ErrorResponseDTO;
import com.devtec.sai.dto.FieldErrorDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponseDTO> handleValidationErrors(MethodArgumentNotValidException ex) {

        List<FieldErrorDTO> erros = ex.getBindingResult()
            .getFieldErrors()
            .stream().map(erro -> new FieldErrorDTO(erro.getField(), erro.getDefaultMessage()))
            .collect(Collectors.toList());

        ErrorResponseDTO response = new ErrorResponseDTO(
                "Dados inválidos",
                HttpStatus.BAD_REQUEST.value(),
                LocalDateTime.now(),
                erros

        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponseDTO> handleAccessDenied(AccessDeniedException ex) {
        ErrorResponseDTO response = new ErrorResponseDTO(
                "Você não possui autorização para realizar esta ação. Entre em contato com o suporte.",
                HttpStatus.FORBIDDEN.value(),
                LocalDateTime.now(),
                null
        );

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponseDTO> handleException(Exception ex) {
        ErrorResponseDTO response = new ErrorResponseDTO(
                "Ocorreu um erro interno no servidor. Contate o suporte.",
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                LocalDateTime.now(),
                null
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}




