import type { StudentProfile } from '../models/types';

const STORAGE_KEY = 'mcq_student_session';

export const DEMO_STUDENTS: StudentProfile[] = [
  { id: 'SHWETA', name: 'Shweta', password: '1234' },
  { id: 'STU002', name: 'Diya Patel', password: '1234' },
  { id: 'STU003', name: 'Kabir Singh', password: '1234' },
];

export function getCurrentStudent(): StudentProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StudentProfile) : null;
  } catch {
    return null;
  }
}

export function setCurrentStudent(student: StudentProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(student));
}

export function clearCurrentStudent(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function validateStudentLogin(studentId: string, password: string): StudentProfile | null {
  const student = DEMO_STUDENTS.find((item) => item.id.toLowerCase() === studentId.trim().toLowerCase());
  if (!student) return null;
  if (student.password !== password.trim()) return null;
  return student;
}
