package com.aluon.core.infra;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.nio.charset.StandardCharsets;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleIllegalArgument(IllegalArgumentException ex) {
        String message = ex.getMessage() != null ? ex.getMessage() : "Solicitud inválida";
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(message);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<String> handleIllegalState(IllegalStateException ex) {
        String message = ex.getMessage() != null ? ex.getMessage() : "La operación no está permitida en el estado actual";
        return ResponseEntity.status(HttpStatus.CONFLICT).body(message);
    }

    @ExceptionHandler(RestClientResponseException.class)
    public ResponseEntity<String> handleRestClient(RestClientResponseException ex) {
        String upstreamBody = safeBody(ex);
        String message = "Error llamando a servicio externo (" + ex.getStatusCode().value() + "): "
                + (upstreamBody.isBlank() ? "respuesta vacía" : upstreamBody);
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(message);
    }

    private static String safeBody(RestClientResponseException ex) {
        try {
            byte[] bytes = ex.getResponseBodyAsByteArray();
            if (bytes == null || bytes.length == 0)
                return "";
            return new String(bytes, StandardCharsets.UTF_8).trim();
        } catch (Exception ignored) {
            return "";
        }
    }
}
