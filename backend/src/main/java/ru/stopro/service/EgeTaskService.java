package ru.stopro.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import ru.stopro.domain.entity.EgeTask;
import ru.stopro.domain.enums.TaskDifficulty;
import ru.stopro.dto.egetask.EgeTaskCreateRequest;
import ru.stopro.dto.egetask.EgeTaskDto;
import ru.stopro.repository.EgeTaskRepository;
import ru.stopro.service.parser.MarkdownTaskParser;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EgeTaskService {

    private final EgeTaskRepository egeTaskRepository;
    private final MarkdownTaskParser markdownTaskParser;

    @Transactional(readOnly = true)
    public Page<EgeTaskDto> findFiltered(
            Integer egeNumber,
            String topicsParam,
            String difficulty,
            String search,
            int page,
            int size
    ) {
        TaskDifficulty diffEnum = null;
        boolean hasDifficulty = false;
        if (difficulty != null && !difficulty.isBlank()) {
            diffEnum = TaskDifficulty.valueOf(difficulty);
            hasDifficulty = true;
        }

        List<String> topics = List.of("___DUMMY___");
        boolean hasTopics = false;
        if (topicsParam != null && !topicsParam.isBlank()) {
            List<String> parsedTopics = Arrays.stream(topicsParam.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
            if (!parsedTopics.isEmpty()) {
                topics = parsedTopics;
                hasTopics = true;
            }
        }

        String searchParam = "";
        boolean hasSearch = false;
        if (search != null && !search.isBlank()) {
            searchParam = "%" + search + "%";
            hasSearch = true;
        }

        Page<EgeTask> entities = egeTaskRepository.findFiltered(
                egeNumber, topics, hasTopics, diffEnum, hasDifficulty, searchParam, hasSearch,
                PageRequest.of(page, size)
        );

        return entities.map(entity -> toDto(entity, false));
    }

    @Transactional
    public EgeTaskDto create(EgeTaskCreateRequest request) {
        EgeTask task = EgeTask.builder()
                .egeNumber(request.getEgeNumber())
                .topic(request.getTopic())
                .difficulty(request.getDifficulty())
                .content(request.getContent())
                .solution(request.getSolution())
                .answer(request.getAnswer())
                .imageUrls(request.getImageUrls() != null ? request.getImageUrls() : new ArrayList<>())
                .build();

        return toDto(egeTaskRepository.save(task), false);
    }

    @Transactional
    public EgeTaskDto uploadMarkdown(MultipartFile file) {
        try {
            String content = new String(file.getBytes(), StandardCharsets.UTF_8);
            EgeTask prototype = markdownTaskParser.parseBatch(content);
            return toDto(egeTaskRepository.save(prototype), true);
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Markdown file: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public EgeTaskDto findById(String id) {
        EgeTask task = egeTaskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found: " + id));
        return toDto(task, true);
    }

    @Transactional
    public void delete(String id) {
        if (!egeTaskRepository.existsById(id)) {
            throw new RuntimeException("Task not found: " + id);
        }
        egeTaskRepository.deleteById(id);
    }

    private EgeTaskDto toDto(EgeTask entity, boolean includeVariants) {
        
        List<String> images = new ArrayList<>();
        if (entity.getImageUrls() != null && !entity.getImageUrls().isEmpty()) {
            images.addAll(entity.getImageUrls());
        }

        EgeTaskDto dto = EgeTaskDto.builder()
                .id(entity.getId())
                .parentId(entity.getParent() != null ? entity.getParent().getId() : null)
                .egeNumber(entity.getEgeNumber())
                .topic(entity.getTopic())
                .difficulty(entity.getDifficulty())
                .content(entity.getContent())
                .solution(entity.getSolution())
                .answer(entity.getAnswer())
                .imageUrls(images)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();

        if (includeVariants && entity.getVariants() != null && !entity.getVariants().isEmpty()) {
            dto.setVariants(entity.getVariants().stream()
                    .map(v -> toDto(v, false))
                    .toList());
        }

        return dto;
    }
}