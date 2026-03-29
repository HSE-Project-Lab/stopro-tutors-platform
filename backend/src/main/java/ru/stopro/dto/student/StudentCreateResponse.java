package ru.stopro.dto.student;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentCreateResponse {
	private StudentDto student;
	private StudentCredentialsDto credentials;
}
