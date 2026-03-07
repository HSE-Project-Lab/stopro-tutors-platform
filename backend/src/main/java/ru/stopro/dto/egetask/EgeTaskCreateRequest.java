package ru.stopro.dto.egetask;

import java.util.List;

import jakarta.validation.constraints.*;
import lombok.Data;

import ru.stopro.domain.enums.TaskDifficulty;

@Data
public class EgeTaskCreateRequest {

	@NotNull
	@Min(1)
	@Max(12)
	private Integer egeNumber;

	@NotBlank
	private String topic;

	@NotNull
	private TaskDifficulty difficulty;

	@NotBlank
	private String content;

	private String solution;

	@NotBlank
	private String answer;

	private List<String> imageUrls;
}