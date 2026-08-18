const STORAGE_KEY = 'mcq_student_session';
export const DEMO_STUDENTS = [
    { id: 'SHWETA', name: 'Shweta', password: '1234' },
    { id: 'STU002', name: 'Diya Patel', password: '1234' },
    { id: 'STU003', name: 'Kabir Singh', password: '1234' },
];
export function getCurrentStudent() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    }
    catch {
        return null;
    }
}
export function setCurrentStudent(student) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(student));
}
export function clearCurrentStudent() {
    localStorage.removeItem(STORAGE_KEY);
}
export function validateStudentLogin(studentId, password) {
    const student = DEMO_STUDENTS.find((item) => item.id.toLowerCase() === studentId.trim().toLowerCase());
    if (!student)
        return null;
    if (student.password !== password.trim())
        return null;
    return student;
}
