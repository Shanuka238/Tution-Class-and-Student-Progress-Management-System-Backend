import AppError from "../errors/apperror.js";

class ClassValidator {
  validateCreateClassInput(data) {
    const { class_name, subject, grade, schedule_days, schedule_start_time, schedule_end_time, venue, max_students, teacher_id } = data;

    if (!class_name || !subject || !grade || !schedule_days || !schedule_start_time || !schedule_end_time || !venue || !max_students || !teacher_id) {
      throw new AppError("Missing required parameters for class initialization", 400);
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(schedule_start_time) || !timeRegex.test(schedule_end_time)) {
      throw new AppError("Schedule times must match 24-hour HH:MM formatting (e.g. 14:30)", 400);
    }

    if (schedule_start_time >= schedule_end_time) {
      throw new AppError("Schedule start time cannot happen at or after the scheduled conclusion time", 400);
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