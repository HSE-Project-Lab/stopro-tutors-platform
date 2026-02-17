// backend/src/main/java/ru/stopro/controller/EgeTaskController.java

package ru.stopro.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ru.stopro.dto.egetask.EgeTaskCreateRequest;
import ru.stopro.dto.egetask.EgeTaskDto;
import ru.stopro.service.EgeTaskService;

@RestController
@RequestMapping("/api/ege-tasks")
@RequiredArgsConstructor
public class EgeTaskController {

    private final EgeTaskService egeTaskService;

    @GetMapping
    public ResponseEntity<Page<EgeTaskDto>> findAll(
            @RequestParam(required = false) Integer egeNumber,
            @RequestParam(required = false) String topics,      // comma-separated
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(
                egeTaskService.findFiltered(egeNumber, topics, difficulty, search, page, size)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<EgeTaskDto> findById(@PathVariable String id) {
        return ResponseEntity.ok(egeTaskService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EgeTaskDto> create(@Valid @RequestBody EgeTaskCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(egeTaskService.create(request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        egeTaskService.delete(id);
        return ResponseEntity.noContent().build();
    }
}