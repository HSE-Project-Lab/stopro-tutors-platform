package ru.stopro.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import ru.stopro.dto.egetask.EgeTaskCreateRequest;
import ru.stopro.dto.egetask.EgeTaskDto;
import ru.stopro.service.EgeTaskService;

@RestController
@RequestMapping("/api/v1/ege-tasks")
@RequiredArgsConstructor
public class EgeTaskController {

    private final EgeTaskService egeTaskService;

    @GetMapping
    public ResponseEntity<Page<EgeTaskDto>> findAll(
            @RequestParam(required = false) Integer egeNumber,
            @RequestParam(required = false) String topics,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(egeTaskService.findFiltered(egeNumber, topics, difficulty, search, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EgeTaskDto> findById(@PathVariable String id) {
        return ResponseEntity.ok(egeTaskService.findById(id));
    }

    @PostMapping
    public ResponseEntity<EgeTaskDto> create(@Valid @RequestBody EgeTaskCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(egeTaskService.create(request));
    }

    @PostMapping(value = "/parse", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<EgeTaskDto> parseTasksPreview(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(egeTaskService.parseMarkdownPreview(file));
    }

    @PostMapping("/batch")
    public ResponseEntity<EgeTaskDto> saveBatch(@RequestBody EgeTaskDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(egeTaskService.saveBatch(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        egeTaskService.delete(id);
        return ResponseEntity.noContent().build();
    }
}