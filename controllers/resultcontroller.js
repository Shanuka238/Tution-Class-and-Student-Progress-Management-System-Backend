import resultService from "../services/resultservice.js";
import examValidator from "../validators/examvalidator.js";
import { toResultDTO } from "../mappers/examresultmapper.js";

class ResultController {
  // Submit a list of exam marks for multiple students in bulk
  async submitBulkResults(req, res, next) {
    try {
      const { examId } = req.params;
      const { results } = req.body;

      examValidator.validateSubmitMarksInput(results);

      const rawData = await resultService.submitBulkResults(examId, results);
      return res.status(200).json({
        success: true,
        message: "Results submitted successfully",
        data: rawData, // Just return bulk write stats
      });
    } catch (error) {
      next(error);
    }
  }

  // Retrieve all student results associated with a specific exam ID
  async getResultsByExam(req, res, next) {
    try {
      const { examId } = req.params;
      const rawData = await resultService.getResultsByExam(examId);
      const mappedData = rawData.map(toResultDTO);
      return res.status(200).json({
        success: true,
        data: mappedData,
      });
    } catch (error) {
      next(error);
    }
  }

  // Fetch the results and rankings profile of the logged-in student user
  async getMyResults(req, res, next) {
    try {
      const userId = req.user._id;
      const rawData = await resultService.getMyResults(userId);
      const mappedData = rawData.map(toResultDTO);
      return res.status(200).json({
        success: true,
        data: mappedData,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ResultController();
