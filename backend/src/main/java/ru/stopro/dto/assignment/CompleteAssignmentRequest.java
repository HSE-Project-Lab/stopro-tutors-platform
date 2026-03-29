package ru.stopro.dto.assignment;

import java.util.HashMap;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompleteAssignmentRequest {

	@Builder.Default
	private Map<String, String> answers = new HashMap<>();
}
