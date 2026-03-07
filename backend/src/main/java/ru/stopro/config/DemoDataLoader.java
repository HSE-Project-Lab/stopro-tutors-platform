package ru.stopro.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import ru.stopro.domain.entity.User;
import ru.stopro.domain.enums.UserRole;
import ru.stopro.repository.UserRepository;

@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class DemoDataLoader implements ApplicationRunner {

	public static final String DEMO_ADMIN_USERNAME = "demo_admin";
	public static final String DEMO_TEACHER_USERNAME = "demo_teacher";
	public static final String DEMO_STUDENT_USERNAME = "demo_student";
	public static final String DEMO_PASSWORD = "demo";

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		createDemoAdmin();
		createDemoTeacher();
		createDemoStudent();
	}

	private void createDemoAdmin() {
		if (userRepository.findByUsername(DEMO_ADMIN_USERNAME).isPresent()) {
			return;
		}
		User demo = User.builder().username(DEMO_ADMIN_USERNAME).passwordHash(passwordEncoder.encode(DEMO_PASSWORD))
				.role(UserRole.ADMIN).fullName("Демо Админ").dataConsentStatus(true).build();
		userRepository.save(demo);
		log.info("Создан демо-админ: {}", DEMO_ADMIN_USERNAME);
	}

	private void createDemoTeacher() {
		if (userRepository.findByUsername(DEMO_TEACHER_USERNAME).isPresent()) {
			return;
		}
		User demo = User.builder().username(DEMO_TEACHER_USERNAME).passwordHash(passwordEncoder.encode(DEMO_PASSWORD))
				.role(UserRole.TEACHER).fullName("Демо Учитель").dataConsentStatus(true).build();
		userRepository.save(demo);
		log.info("Создан демо-учитель: {}", DEMO_TEACHER_USERNAME);
	}

	private void createDemoStudent() {
		if (userRepository.findByUsername(DEMO_STUDENT_USERNAME).isPresent()) {
			return;
		}
		User demo = User.builder().username(DEMO_STUDENT_USERNAME).passwordHash(passwordEncoder.encode(DEMO_PASSWORD))
				.role(UserRole.STUDENT).fullName("Демо Ученик").dataConsentStatus(true).build();
		userRepository.save(demo);
		log.info("Создан демо-ученик: {}", DEMO_STUDENT_USERNAME);
	}
}