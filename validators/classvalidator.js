import AppError from "../errors/apperror.js";

class ClassValidator {
  validateCreateClassInput(data) {
    const { class_name, subject, grade, venue, max_students } = data;

    if (!class_name || !subject || !grade || !venue || !max_students) {
      throw new AppError("Missing required parameters for class initialization", 400);
    }

    if (parseInt(max_students, 10) <= 0) {
      throw new AppError("Maximum classroom student capacity must be at least 1", 400);
    }

    return true;
  }

  validateEnrollmentInput(data) {
    const { student_id, class_id } = data;
    if (!student_id || !class_id) {
      throw new AppError("Both student_id and class_id are required fields for enrollment processing", 400);
    }
    return true;
  }
}

export default new ClassValidator();