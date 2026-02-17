// backend/src/main/java/ru/stopro/service/EgeTaskService.java

package ru.stopro.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.stopro.domain.entity.EgeTask;
import ru.stopro.domain.enums.TaskDifficulty;
import ru.stopro.dto.egetask.EgeTaskCreateRequest;
import ru.stopro.dto.egetask.EgeTaskDto;
import ru.stopro.repository.EgeTaskRepository;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EgeTaskService {

    private final EgeTaskRepository egeTaskRepository;

    @Transactional(readOnly = true)
    public Page<EgeTaskDto> findFiltered(
            Integer egeNumber,
            String topicsParam,  // comma-separated: "Проценты,Дроби"
            String difficulty,
            String search,
            int page,
            int size
    ) {
        TaskDifficulty diffEnum = null;
        if (difficulty != null && !difficulty.isBlank()) {
            diffEnum = TaskDifficulty.valueOf(difficulty);
        }

        List<String> topics = null;
        if (topicsParam != null && !topicsParam.isBlank()) {
            topics = Arrays.stream(topicsParam.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        }

        String searchParam = (search != null && !search.isBlank()) ? search : null;

        Page<EgeTask> entities = egeTaskRepository.findFiltered(
                egeNumber, topics, diffEnum, searchParam,
                PageRequest.of(page, size)
        );

        return entities.map(this::toDto);
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

        EgeTask saved = egeTaskRepository.save(task);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public EgeTaskDto findById(String id) {
        EgeTask task = egeTaskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Задача не найдена: " + id));
        return toDto(task);
    }

    @Transactional
    public void delete(String id) {
        if (!egeTaskRepository.existsById(id)) {
            throw new RuntimeException("Задача не найдена: " + id);
        }
        egeTaskRepository.deleteById(id);
    }

    private EgeTaskDto toDto(EgeTask entity) {
        return EgeTaskDto.builder()
                .id(entity.getId())
                .egeNumber(entity.getEgeNumber())
                .topic(entity.getTopic())
                .difficulty(entity.getDifficulty())
                .content(entity.getContent())
                .solution(entity.getSolution())
                .answer(entity.getAnswer())
                .imageUrls(entity.getImageUrls())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}