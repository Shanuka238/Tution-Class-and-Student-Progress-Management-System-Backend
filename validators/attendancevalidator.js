import AppError from "../errors/apperror.js";
import { ATTENDANCE_STATUS_VALUES } from "../enums/attendanceenum.js";

class AttendanceValidator {
  validateBulkAttendanceInput(records) {
    if (!records || !Array.isArray(records) || records.length === 0) {
      throw new AppError("A non-empty records array is required for bulk attendance submission", 400);
    }

    for (const record of records) {
      if (!record.student_id) {
        throw new AppError("Each attendance record must contain a valid student_id", 400);
      }
      if (!record.status || !ATTENDANCE_STATUS_VALUES.includes(record.status)) {
        throw new AppError(`Invalid status '${record.status}'. Allowed values: ${ATTENDANCE_STATUS_VALUES.join(", ")}`, 400);
      }
    }

    return true;
  }
}

export default new AttendanceValidator();
