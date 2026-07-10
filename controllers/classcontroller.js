import classService from "../services/classservice.js";
import classValidator from "../validators/classvalidator.js";
import { toClassDTO, toClassSessionDTO } from "../mappers/classmapper.js";

class ClassController {
  // Create a new class with validation
  async createClass(req, res, next) {
    try {
      // Validate input data
      classValidator.validateCreateClassInput(req.body);

      // Create class and check for schedule conflicts
      const rawData = await classService.createClass(req.body);

      return res.status(201).json({
        success: true,
        message: "Tuition class initialized and scheduled successfully",
        data: toClassDTO(rawData),
      });
    } catch (error) {
      next(error);
    }
  }

  // Fetch all active classes
  async getActiveClasses(req, res, next) {
    try {
      const rawData = await classService.getActiveClasses();
      const mappedData = rawData.map(toClassDTO);
      return res.status(200).json({
        success: true,
        message: "Active class directory retrieved successfully",
        data: mappedData,
      });
    } catch (error) {
      next(error);
    }
  }

  // Fetch a student's own enrolled classes
  async getMyClasses(req, res, next) {
    try {
      const userId = req.user._id;
      const rawData = await classService.getMyClasses(userId);
      // Data is from StudentClassDAO, which returns StudentClass models populated with Class data.
      // For simplicity, we can map the class_id objects
      const mappedData = rawData.map(enrollment => toClassDTO(enrollment.class_id));
      return res.status(200).json({
        success: true,
        message: "Your enrolled classes retrieved successfully",
        data: mappedData,
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

  // Get timetable for a specific date range
  async getTimetable(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const rawData = await classService.getTimetable(startDate, endDate);
      const mappedData = rawData.map(toClassSessionDTO);

      return res.status(200).json({
        success: true,
        message: "Timetable retrieved successfully",
        data: mappedData,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ClassController();