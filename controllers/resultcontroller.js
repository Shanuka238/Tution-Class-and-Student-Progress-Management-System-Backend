import resultService from "../services/resultservice.js";
import { toResultDTO } from "../mappers/examresultmapper.js";

class ResultController {
  async submitBulkResults(req, res, next) {
    try {
      const { examId } = req.params;
      const { results } = req.body;

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
