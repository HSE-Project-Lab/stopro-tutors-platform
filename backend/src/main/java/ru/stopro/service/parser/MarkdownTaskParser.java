package ru.stopro.service.parser;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

import ru.stopro.domain.entity.EgeTask;
import ru.stopro.domain.enums.TaskDifficulty;

@Component
public class MarkdownTaskParser {

	private static final Pattern YAML_PATTERN = Pattern.compile("(?m)^---\\s*\\n(.*?)\\n---\\s*\\n", Pattern.DOTALL);
	private static final Pattern EGE_NUMBER_PATTERN = Pattern.compile("egeNumber:\\s*(\\d+)");
	private static final Pattern TOPIC_PATTERN = Pattern.compile("topic:\\s*(.+)");
	private static final Pattern DIFFICULTY_PATTERN = Pattern.compile("difficulty:\\s*(\\w+)");
	private static final String BLOCK_DELIMITER = "(?m)^---\\s*$";

	public EgeTask parseBatch(String rawContent) {
		String content = rawContent.replace("\r\n", "\n").replace("\r", "\n");

		Matcher yamlMatcher = YAML_PATTERN.matcher(content);
		if (!yamlMatcher.find()) {
			throw new IllegalArgumentException(
					"Ошибка парсинга: не найден блок YAML Frontmatter. Проверьте дефисы ---");
		}

		String yamlConfig = yamlMatcher.group(1);
		Integer egeNumber = extractInt(yamlConfig, EGE_NUMBER_PATTERN);
		String topic = extractString(yamlConfig, TOPIC_PATTERN);
		TaskDifficulty difficulty = TaskDifficulty.valueOf(extractString(yamlConfig, DIFFICULTY_PATTERN).toUpperCase());

		String remainingContent = content.substring(yamlMatcher.end());
		String[] blocks = remainingContent.split(BLOCK_DELIMITER);

		EgeTask prototype = null;
		List<EgeTask> variants = new ArrayList<>();

		for (String block : blocks) {
			if (block.trim().isEmpty())
				continue;

			EgeTask task = parseTaskBlock(block.trim(), egeNumber, topic, difficulty);

			if (prototype == null) {
				prototype = task;
			} else {
				task.setParent(prototype);
				variants.add(task);
			}
		}

		if (prototype != null) {
			prototype.setVariants(variants);
		}

		return prototype;
	}

	private EgeTask parseTaskBlock(String block, Integer egeNumber, String topic, TaskDifficulty difficulty) {
		String contentPart = block;
		String answerPart = "";
		String solutionPart = null;

		int answerIdx = block.indexOf("## Ответ");
		int solutionIdx = block.indexOf("## Решение");

		if (answerIdx != -1) {
			contentPart = block.substring(0, answerIdx).trim();
			contentPart = contentPart.replaceFirst("^#\\s+.*\\n", "").trim();

			if (solutionIdx != -1) {
				answerPart = block.substring(answerIdx + 8, solutionIdx).trim();
				solutionPart = block.substring(solutionIdx + 10).trim();
			} else {
				answerPart = block.substring(answerIdx + 8).trim();
			}
		} else {
			contentPart = contentPart.replaceFirst("^#\\s+.*\\n", "").trim();
		}

		return EgeTask.builder().egeNumber(egeNumber).topic(topic).difficulty(difficulty).content(contentPart)
				.answer(answerPart).solution(solutionPart).build();
	}

	private Integer extractInt(String text, Pattern pattern) {
		Matcher m = pattern.matcher(text);
		return m.find() ? Integer.parseInt(m.group(1).trim()) : 1;
	}

	private String extractString(String text, Pattern pattern) {
		Matcher m = pattern.matcher(text);
		return m.find() ? m.group(1).trim() : "Unknown";
	}
}