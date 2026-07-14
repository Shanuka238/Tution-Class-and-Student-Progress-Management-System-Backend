import resultDAO from "../daos/resultdao.js";
import examDAO from "../daos/examdao.js";
import studentDAO from "../daos/studentdao.js";
import AppError from "../errors/apperror.js";

class ResultService {
  // Utility function to calculate grade based on percentage
  calculateGrade(marksObtained, totalMarks) {
    if (totalMarks <= 0) return "N/A";
    const percentage = (marksObtained / totalMarks) * 100;
    
    if (percentage >= 75) return "A";
    if (percentage >= 65) return "B";
    if (percentage >= 55) return "C";
    if (percentage >= 35) return "S";
    return "F";
  }

  // Calculate ranks for an array of result objects
  calculateRanks(results) {
    // Sort results by marks descending
    const sorted = [...results].sort((a, b) => b.marks_obtained - a.marks_obtained);
    
    let currentRank = 1;
    let previousMarks = -1;
    let sameRankCount = 0;

    sorted.forEach((result, index) => {
      if (result.marks_obtained === previousMarks) {
        // Tied marks get the same rank
        result.rank = currentRank;
        sameRankCount++;
      } else {
        // Next rank jumps by the number of tied students
        currentRank += sameRankCount;
        // Exception: first item
        if (index === 0) currentRank = 1;

        result.rank = currentRank;
        previousMarks = result.marks_obtained;
        sameRankCount = 1;
      }
    });

    return sorted;
  }

  async submitBulkResults(examId, resultsData) {
    if (!examId || !Array.isArray(resultsData)) {
      throw new AppError("Invalid payload for result submission", 400);
    }

    const exam = await examDAO.findById(examId);
    if (!exam) {
      throw new AppError("Exam not found", 404);
    }

    // First fetch any existing results to ensure our ranking calculation includes previous entries if updating partially
    // (Assuming bulk submit overwrites all or we just rank the passed in data if it's the whole class)
    // For simplicity, we assume resultsData contains the marks for the entire class taking the exam.
    
    // 1. Calculate Grades
    const gradedResults = resultsData.map(result => {
      return {
        ...result,
        exam_id: examId,
        grade: this.calculateGrade(result.marks_obtained, exam.total_marks)
      };
    });

    // 2. Calculate Ranks
    const rankedResults = this.calculateRanks(gradedResults);

    // 3. Save to DB
    return await resultDAO.bulkUpsert(rankedResults);
  }

  async getResultsByExam(examId) {
    if (!examId) {
      throw new AppError("Exam ID is required", 400);
    }
    return await resultDAO.findByExamId(examId);
  }

  async getMyResults(userId) {
    const student = await studentDAO.findByUserId(userId);
    if (!student) {
      throw new AppError("Student profile not found", 404);
    }
    return await resultDAO.findByStudentId(student._id);
  }
}

export default new ResultService();
