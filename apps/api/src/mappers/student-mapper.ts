import type { Student } from "@/models/student";
import type {
  StudentResponseDto,
  CreateStudentDto,
  UpdateStudentDto,
} from "@/dtos/student";

/**
 * Maps a Student model to a StudentResponseDto
 */
export function mapStudentToResponseDto(student: Student): StudentResponseDto {
  return {
    id: student.id,
    name: student.name,
    email: student.email,
    age: student.age ?? null,
    createdAt: student.createdAt.toISOString() as any, // Type assertion for Date to string conversion
  };
}

/**
 * Maps an array of Student models to an array of StudentResponseDtos
 */
export function mapStudentsToResponseDtos(
  students: Student[]
): StudentResponseDto[] {
  return students.map(mapStudentToResponseDto);
}

/**
 * Maps a CreateStudentDto to CreateStudentData (for service layer)
 */
export function mapCreateDtoToData(dto: CreateStudentDto) {
  return {
    name: dto.name,
    email: dto.email,
    age: dto.age,
  };
}

/**
 * Maps an UpdateStudentDto to UpdateStudentData (for service layer)
 */
export function mapUpdateDtoToData(dto: UpdateStudentDto) {
  return {
    name: dto.name,
    email: dto.email,
    age: dto.age,
  };
}
