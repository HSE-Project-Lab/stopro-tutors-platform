package ru.stopro.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Глобальный обработчик исключений для всех контроллеров.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

	/**
	 * Ошибки валидации (@Valid).
	 */
	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
		Map<String, String> fieldErrors = new HashMap<>();
		for (FieldError error : ex.getBindingResult().getFieldErrors()) {
			fieldErrors.put(error.getField(), error.getDefaultMessage());
		}

		Map<String, Object> body = new HashMap<>();
		body.put("timestamp", LocalDateTime.now().toString());
		body.put("status", 400);
		body.put("error", "Validation Failed");
		body.put("message", "Ошибка валидации запроса");
		body.put("fieldErrors", fieldErrors);

		log.warn("Validation error: {}", fieldErrors);
		return ResponseEntity.badRequest().body(body);
	}

	/**
	 * Ошибка чтения тела запроса (некорректный JSON, отсутствие body, неверный
	 * формат полей).
	 */
	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<Map<String, Object>> handleUnreadable(HttpMessageNotReadableException ex) {
		Map<String, Object> body = new HashMap<>();
		body.put("timestamp", LocalDateTime.now().toString());
		body.put("status", 400);
		body.put("error", "Bad Request");
		body.put("message", "Невозможно прочитать тело запроса. Проверьте формат JSON и типы полей.");
		body.put("details", ex.getMostSpecificCause().getMessage());

		log.warn("HTTP message not readable: {}", ex.getMostSpecificCause().getMessage());
		return ResponseEntity.badRequest().body(body);
	}

	/**
	 * Общее RuntimeException (fallback).
	 */
	@ExceptionHandler(RuntimeException.class)
	public ResponseEntity<Map<String, Object>> handleRuntime(RuntimeException ex) {
		Map<String, Object> body = new HashMap<>();
		body.put("timestamp", LocalDateTime.now().toString());
		body.put("status", 500);
		body.put("error", "Internal Server Error");
		body.put("message", ex.getMessage());

		log.error("Unhandled runtime exception", ex);
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
	}
}
