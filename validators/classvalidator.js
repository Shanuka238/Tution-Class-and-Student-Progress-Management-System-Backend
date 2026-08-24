import AppError from "../errors/apperror.js";

//Class and Course Payload Validator
class ClassValidator {
  //Validate class creation input
  validateCreateClassInput(data) {
    const { class_name, subject, grade, start_date, end_date, max_students } = data;

    if (!class_name || !subject || !grade || !start_date || !end_date || !max_students) {
      throw new AppError("Missing required parameters for class initialization (title, subject, grade, start/end dates, cap)", 400);
    }

    if (parseInt(max_students, 10) <= 0) {
      throw new AppError("Maximum classroom student capacity must be at least 1", 400);
    }

    return true;
  }

  //Validate student course enrollment request
  validateEnrollmentInput(data) {
    const { student_id, class_id } = data;
    if (!student_id || !class_id) {
      throw new AppError("Both student_id and class_id are required fields for enrollment processing", 400);
    }
    return true;
  }
}

export default new ClassValidator();