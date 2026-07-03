import classService from "../services/classservice.js";
import classValidator from "../validators/classvalidator.js";

class ClassController {
  // Create a new class with validation
  async createClass(req, res, next) {
    try {
      // Validate input data
      classValidator.validateCreateClassInput(req.body);

      // Create class and check for schedule conflicts
      const data = await classService.createClass(req.body);

      return res.status(201).json({
        success: true,
        message: "Tuition class initialized and scheduled successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Fetch all active classes
  async getActiveClasses(req, res, next) {
    try {
      const data = await classService.getActiveClasses();
      return res.status(200).json({
        success: true,
        message: "Active class directory retrieved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Enroll a student into a class
  async enrollStudent(req, res, next) {
    try {
      // Validate enrollment input
      classValidator.validateEnrollmentInput(req.body);

      const { student_id, class_id } = req.body;

      // Assign student to class and verify capacity
      const data = await classService.assignStudentToClass(student_id, class_id);

      return res.status(201).json({
        success: true,
        message: "Student successfully enrolled into the class roster",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Remove a student from a class
  async dropStudent(req, res, next) {
    try {
      classValidator.validateEnrollmentInput(req.body);
      const { student_id, class_id } = req.body;

      const data = await classService.dropStudentFromClass(student_id, class_id);

      return res.status(200).json({
        success: true,
        message: "Student dropped from class listing successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete a class and all enrollments
  async deleteClass(req, res, next) {
    try {
      const { id } = req.params;

      const data = await classService.deleteClass(id);

      return res.status(200).json({
        success: true,
        message: "Class deleted successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get timetable for a specific day or all days
  async getTimetable(req, res, next) {
    try {
      const { day } = req.query;
      const data = await classService.getTimetable(day);

      return res.status(200).json({
        success: true,
        message: "Timetable retrieved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ClassController();