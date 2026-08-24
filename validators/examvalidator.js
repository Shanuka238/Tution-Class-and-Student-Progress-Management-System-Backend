import AppError from "../errors/apperror.js";

class ExamValidator {
  validateCreateExamInput(data) {
    const { exam_title, exam_date, total_marks } = data;

    if (!exam_title || !exam_date) {
      throw new AppError("Missing required parameters for exam creation (exam_title, exam_date)", 400);
    }

    if (total_marks !== undefined) {
      const marksNum = Number(total_marks);
      if (isNaN(marksNum) || marksNum <= 0) {
        throw new AppError("Total marks must be a positive number", 400);
      }
    }

    const parsedDate = new Date(exam_date);
    if (isNaN(parsedDate.getTime())) {
      throw new AppError("Invalid exam date format provided", 400);
    }

    return true;
  }

  validateSubmitMarksInput(records) {
    if (!records || !Array.isArray(records) || records.length === 0) {
      throw new AppError("A non-empty marks records array is required", 400);
    }

    for (const record of records) {
      if (!record.student_id) {
        throw new AppError("Each mark record must contain a valid student_id", 400);
      }
      if (record.marks_obtained !== undefined) {
        const marks = Number(record.marks_obtained);
        if (isNaN(marks) || marks < 0) {
          throw new AppError("Marks obtained must be a non-negative number", 400);
        }
      }
    }

    return true;
  }
}

export default new ExamValidator();
