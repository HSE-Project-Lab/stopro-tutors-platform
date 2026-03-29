package ru.stopro.service;

import java.util.concurrent.CompletableFuture;

import org.springframework.stereotype.Service;

import ru.stopro.domain.entity.Attempt;

@Service
public class AiAnalysisService {

	public CompletableFuture<Void> analyzeAttempt(Attempt attempt) {
		return CompletableFuture.completedFuture(null);
	}
}
