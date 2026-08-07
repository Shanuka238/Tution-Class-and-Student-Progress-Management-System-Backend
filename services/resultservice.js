import resultDAO from "../daos/resultdao.js";
import examDAO from "../daos/examdao.js";
import studentDAO from "../daos/studentdao.js";
import AppError from "../errors/apperror.js";
import { LETTER_GRADES } from "../enums/examenum.js";

class ResultService {
  // Utility function to calculate grade based on percentage (A/B/C/S/F)
  calculateGrade(marksObtained, totalMarks) {
    if (totalMarks <= 0) return "N/A";
    const percentage = (marksObtained / totalMarks) * 100;
    
    if (percentage >= 75) return LETTER_GRADES.A;
    if (percentage >= 65) return LETTER_GRADES.B;
    if (percentage >= 55) return LETTER_GRADES.C;
    if (percentage >= 35) return LETTER_GRADES.S;
    return LETTER_GRADES.F;
  }

  // Calculate student ranks within a class, handling ties properly
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

  // Submit bulk exam marks, auto-calculating grades and ranks before storing
  async submitBulkResults(examId, resultsData) {
    if (!examId || !Array.isArray(resultsData)) {
      throw new AppError("Invalid payload for result submission", 400);
    }

    const exam = await examDAO.findById(examId);
    if (!exam) {
      throw new AppError("Exam not found", 404);
    }

    // First fetch any existing results to ensure our ranking calculation includes previous entries if updating partially

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
    const saved = await resultDAO.bulkUpsert(rankedResults);

    // 4. Send real-time result notifications to students & parents
    try {
      const notificationService = (await import("./notificationservice.js")).default;
      for (const resItem of rankedResults) {
        if (resItem.student_id) {
          await notificationService.notifyStudentAndParent(resItem.student_id, {
            title: `Exam Result Published: ${exam.exam_title || exam.term || "Assessment"}`,
            message: `Your score: ${resItem.marks_obtained}/${exam.total_marks || 100} (Grade: ${resItem.grade}, Rank: #${resItem.rank})`,
            type: "result",
          });
        }
      }
    } catch (notifErr) {
      console.error("Error triggering result notifications:", notifErr);
    }

    return saved;
  }

  // Retrieve all results for a specific exam
  async getResultsByExam(examId) {
    if (!examId) {
      throw new AppError("Exam ID is required", 400);
    }
    return await resultDAO.findByExamId(examId);
  }

  // Fetch results and class ranks for the logged-in student user
  async getMyResults(userId) {
    const student = await studentDAO.findByUserId(userId);
    if (!student) {
      throw new AppError("Student profile not found", 404);
    }
    return await resultDAO.findByStudentId(student._id);
  }
}

export default new ResultService();
