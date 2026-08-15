import chatLogDAO from "../daos/chatlogdao.js";
import studentDAO from "../daos/studentdao.js";
import teacherDAO from "../daos/teacherdao.js";
import parentDAO from "../daos/parentdao.js";
import feeDAO from "../daos/feedao.js";
import examDAO from "../daos/examdao.js";
import resultDAO from "../daos/resultdao.js";
import attendanceDAO from "../daos/attendancedao.js";
import ClassSession from "../models/classsessionmodel.js";
import AppError from "../errors/apperror.js";

class ChatbotService {
  // Main entrypoint: process user question with role data isolation & Gemini AI
  async processQuestion(user, question) {
    if (!question || !question.trim()) {
      throw new AppError("Question text is required", 400);
    }

    const role = user.role ? String(user.role).toLowerCase() : "student";

    // 1. Gather role-scoped MongoDB context data
    const contextData = await this._assembleRoleContext(user, role);

    // 2. Generate response using Gemini API or Smart Fallback Engine
    let aiResponse = "";
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY") {
      aiResponse = await this._callGeminiAPI(question, role, user, contextData);
    } else {
      aiResponse = this._generateSmartFallbackResponse(question, role, user, contextData);
    }

    // 3. Persist interaction to ChatLog
    try {
      await chatLogDAO.createLog({
        user_id: user._id,
        user_role: role,
        question: question.trim(),
        response: aiResponse,
      });
    } catch (err) {
      console.error("Error saving ChatLog:", err);
    }

    return {
      question: question.trim(),
      response: aiResponse,
      role: role,
    };
  }

  // Retrieve user's previous chat history
  async getChatHistory(userId) {
    return await chatLogDAO.getHistoryByUserId(userId);
  }

  // Clear user's chat history
  async clearChatHistory(userId) {
    return await chatLogDAO.clearHistoryByUserId(userId);
  }

  // Assemble comprehensive role-scoped data from MongoDB with zero context leaks
  async _assembleRoleContext(user, role) {
    const context = {
      system_name: "EduManage 360",
      user_name: `${user.first_name} ${user.last_name}`,
      role: role,
      date: new Date().toISOString().split("T")[0],
    };

    try {
      if (role === "admin") {
        const User = (await import("../models/usermodel.js")).default;
        const Student = (await import("../models/studentmodel.js")).default;
        const Teacher = (await import("../models/teachermodel.js")).default;
        const Parent = (await import("../models/parentmodel.js")).default;
        const ClassModel = (await import("../models/classmodel.js")).default;
        const Result = (await import("../models/resultmodel.js")).default;
        const Attendance = (await import("../models/attendancemodel.js")).default;

        const allUsers = await User.find();
        const studentCount = await Student.countDocuments();
        const teacherCount = await Teacher.countDocuments();
        const parentCount = await Parent.countDocuments();
        const allClasses = await ClassModel.find().populate({
          path: "teacher_id",
          populate: { path: "user_id", select: "first_name last_name" },
        });

        const activeClassesList = allClasses.map((c) => ({
          class_name: c.class_name,
          subject: c.subject,
          grade: c.grade,
          fee_amount: c.fee_amount,
          teacher_name: c.teacher_id?.user_id
            ? `${c.teacher_id.user_id.first_name} ${c.teacher_id.user_id.last_name}`
            : "Unassigned",
          enrolled_count: c.enrolled_students?.length || 0,
        }));

        const allFeeStats = await feeDAO.getFinancialStats({});
        const unpaidFees = await feeDAO.findWithFilters({ status: "unpaid" });
        const overdueFees = await feeDAO.findWithFilters({ status: "overdue" });
        const pendingFees = await feeDAO.findWithFilters({ status: { $in: ["unpaid", "overdue"] } });

        const allResults = await Result.find()
          .populate({
            path: "student_id",
            populate: { path: "user_id", select: "first_name last_name email" },
          })
          .populate({
            path: "exam_id",
            populate: { path: "class_id", select: "class_name subject" },
          })
          .limit(100);

        const studentPerformanceList = allResults.map((r) => ({
          student_name: r.student_id?.user_id
            ? `${r.student_id.user_id.first_name} ${r.student_id.user_id.last_name}`
            : "Student",
          class_name: r.exam_id?.class_id?.class_name || "Course",
          exam_title: r.exam_id?.exam_title || r.exam_id?.term || "Exam",
          marks_obtained: r.marks_obtained,
          total_marks: r.exam_id?.total_marks || 100,
          grade: r.grade,
          rank: r.rank,
        }));

        const unpaidStudentsList = pendingFees.map((f) => ({
          student_name: f.student_id?.user_id
            ? `${f.student_id.user_id.first_name} ${f.student_id.user_id.last_name}`
            : "Student",
          student_number: f.student_id?.student_number || "STU-000",
          course_name: f.class_id?.class_name || "Tuition Class",
          month: f.month,
          amount: f.amount,
          status: f.status,
          due_date: f.due_date,
        }));

        // Overall Attendance Health
        const allAttendanceLogs = await Attendance.find();
        const totalLogs = allAttendanceLogs.length;
        const presentLogs = allAttendanceLogs.filter((a) => a.status === "present" || a.status === "late").length;
        const overallAttendanceRate = totalLogs > 0 ? Math.round((presentLogs / totalLogs) * 100) : 0;

        context.admin_summary = {
          total_users: allUsers.length,
          student_count: studentCount || allUsers.filter((u) => u.role === "student").length,
          teacher_count: teacherCount || allUsers.filter((u) => u.role === "teacher").length,
          parent_count: parentCount || allUsers.filter((u) => u.role === "parent").length,
          total_classes: allClasses.length,
          classes_list: activeClassesList,
          financial_summary: allFeeStats,
          unpaid_fees_count: unpaidFees.length,
          overdue_fees_count: overdueFees.length,
          total_pending_unpaid_count: pendingFees.length,
          unpaid_students: unpaidStudentsList,
          attendance_health: {
            total_logs: totalLogs,
            present_logs: presentLogs,
            overall_attendance_rate: `${overallAttendanceRate}%`,
          },
          student_exam_performance: studentPerformanceList,
        };
      } else if (role === "teacher") {
        const teacherDoc = await teacherDAO.findByUserId(user._id);
        if (teacherDoc) {
          const ClassModel = (await import("../models/classmodel.js")).default;
          const teacherClasses = await ClassModel.find({ teacher_id: teacherDoc._id });
          const sessions = await ClassSession.find({ teacher_id: teacherDoc._id }).populate("course_id");
          const teacherExams = await examDAO.findWithFilters({ created_by: teacherDoc._id });

          let examResultsSummary = [];
          for (const exam of teacherExams) {
            const results = await resultDAO.findByExamId(exam._id);
            const totalStudents = results.length;
            const failed = results.filter((r) => r.grade === "F" || (r.marks_obtained / (exam.total_marks || 100)) < 0.4);
            const passed = results.filter((r) => r.grade !== "F" && (r.marks_obtained / (exam.total_marks || 100)) >= 0.4);
            
            const totalMarksSum = results.reduce((acc, curr) => acc + (curr.marks_obtained || 0), 0);
            const averageScore = totalStudents > 0 ? Math.round(totalMarksSum / totalStudents) : 0;

            examResultsSummary.push({
              exam_title: exam.exam_title,
              term: exam.term,
              total_students: totalStudents,
              passed_count: passed.length,
              failed_count: failed.length,
              average_score: averageScore,
              failed_students: failed.map((f) => ({
                student_name: f.student_id?.user_id
                  ? `${f.student_id.user_id.first_name} ${f.student_id.user_id.last_name}`
                  : "Student",
                marks: f.marks_obtained,
                grade: f.grade,
              })),
            });
          }

          context.teacher_summary = {
            assigned_classes: teacherClasses.map((c) => ({
              class_name: c.class_name,
              subject: c.subject,
              grade: c.grade,
              enrolled_count: c.enrolled_students?.length || 0,
            })),
            total_sessions: sessions.length,
            conducted_sessions: sessions.slice(0, 20).map((s) => ({
              class_name: s.course_id?.class_name || "Course",
              date: s.date,
              time: `${s.start_time} - ${s.end_time}`,
              venue: s.venue,
              status: s.status,
            })),
            total_exams_conducted: teacherExams.length,
            exam_performance: examResultsSummary,
          };
        }
      } else if (role === "student") {
        const studentDoc = await studentDAO.findByUserId(user._id);
        if (studentDoc) {
          const ClassModel = (await import("../models/classmodel.js")).default;
          const myClasses = await ClassModel.find({ enrolled_students: studentDoc._id }).populate({
            path: "teacher_id",
            populate: { path: "user_id", select: "first_name last_name" },
          });

          const myResults = await resultDAO.findByStudentId(studentDoc._id);
          const myFees = await feeDAO.findWithFilters({ student_id: studentDoc._id });
          const myAttendance = await attendanceDAO.findByStudentId(studentDoc._id);

          const totalAtt = myAttendance.length;
          const presentAtt = myAttendance.filter((a) => a.status === "present" || a.status === "late").length;
          const attRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;

          context.student_summary = {
            student_number: studentDoc.student_number,
            enrolled_classes: myClasses.map((c) => ({
              class_name: c.class_name,
              subject: c.subject,
              grade: c.grade,
              teacher_name: c.teacher_id?.user_id
                ? `${c.teacher_id.user_id.first_name} ${c.teacher_id.user_id.last_name}`
                : "Teacher",
            })),
            exam_results: myResults.map((r) => ({
              exam_title: r.exam_id?.exam_title || "Exam",
              course_name: r.exam_id?.class_id?.class_name || "Course",
              term: r.exam_id?.term,
              marks_obtained: r.marks_obtained,
              total_marks: r.exam_id?.total_marks || 100,
              grade: r.grade,
              rank: r.rank,
            })),
            fees_history: myFees.map((f) => ({
              course_name: f.class_id?.class_name || "Tuition Fee",
              month: f.month,
              amount: f.amount,
              status: f.status,
              due_date: f.due_date,
            })),
            attendance_summary: {
              total_sessions: totalAtt,
              present: myAttendance.filter((a) => a.status === "present").length,
              absent: myAttendance.filter((a) => a.status === "absent").length,
              late: myAttendance.filter((a) => a.status === "late").length,
              attendance_rate: `${attRate}%`,
            },
          };
        }
      } else if (role === "parent") {
        const parentDoc = await parentDAO.findByUserId(user._id);
        if (parentDoc) {
          const children = await studentDAO.findStudentsByParentId(parentDoc._id);
          let childrenSummary = [];
          for (const child of children) {
            const results = await resultDAO.findByStudentId(child._id);
            const fees = await feeDAO.findWithFilters({ student_id: child._id });
            const attendance = await attendanceDAO.findByStudentId(child._id);

            const pendingChildFees = fees.filter((f) => f.status !== "paid");
            const presentChildLogs = attendance.filter((a) => a.status === "present" || a.status === "late").length;
            const childAttRate = attendance.length > 0 ? Math.round((presentChildLogs / attendance.length) * 100) : 0;

            childrenSummary.push({
              child_name: child.user_id ? `${child.user_id.first_name} ${child.user_id.last_name}` : "Child",
              student_number: child.student_number,
              unpaid_fees_count: pendingChildFees.length,
              pending_fees_details: pendingChildFees.map((f) => ({
                course_name: f.class_id?.class_name || "Course",
                month: f.month,
                amount: f.amount,
                status: f.status,
                due_date: f.due_date,
              })),
              exam_performance: results.map((r) => ({
                exam_title: r.exam_id?.exam_title || "Exam",
                term: r.exam_id?.term,
                grade: r.grade,
                marks: r.marks_obtained,
                rank: r.rank,
              })),
              attendance: {
                total_sessions: attendance.length,
                attendance_rate: `${childAttRate}%`,
              },
            });
          }

          context.parent_summary = {
            children_count: children.length,
            children: childrenSummary,
          };
        }
      }
    } catch (err) {
      console.error("Error building context data:", err);
    }

    return context;
  }

  // Call Google Gemini API (via SDK or REST API)
  async _callGeminiAPI(question, role, user, contextData) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY") {
      return this._generateSmartFallbackResponse(question, role, user, contextData);
    }

    const selectedModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const promptText = `You are EduManage 360 AI Assistant, an intelligent, helpful academic assistant for a tuition class & student progress management system.
Logged in User: ${user.first_name} ${user.last_name} (Role: ${role.toUpperCase()})
Today's Date: ${contextData.date}

REAL-TIME SYSTEM MONGODB CONTEXT DATA FOR THIS USER:
${JSON.stringify(contextData, null, 2)}

INSTRUCTIONS:
1. Answer the user's question clearly, politely, and accurately based on the provided real-time data.
2. Note that unpaid fees include BOTH status "unpaid" AND status "overdue". Check the 'unpaid_students' or 'pending_fees_details' array carefully!
3. Use clear formatting (bullet points, bold text, numbers) where applicable.
4. Strictly enforce security: do NOT answer questions outside the scope of the user's role data context.
5. Keep answers concise, informative, and actionable.

USER QUESTION: "${question}"`;

    // Attempt 1: Using @google/genai SDK
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: promptText,
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (sdkError) {
      console.warn(`Gemini SDK call warning for ${selectedModel}, attempting REST endpoint:`, sdkError.message);
    }

    // Attempt 2: Direct REST fetch call to Gemini Endpoint
    try {
      const restEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
      const res = await fetch(restEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            maxOutputTokens: 600,
            temperature: 0.3,
          },
        }),
      });

      const data = await res.json();
      const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textOutput) {
        return textOutput;
      }
    } catch (restError) {
      console.error("Gemini REST API call failed:", restError.message);
    }

    // Attempt 3: Intelligent context engine fallback
    return this._generateSmartFallbackResponse(question, role, user, contextData);
  }

  // Intelligent Context-Aware Natural Language NLP Fallback Engine
  _generateSmartFallbackResponse(question, role, user, contextData) {
    const q = question.toLowerCase();

    // General Conversational Greetings
    if (q === "hi" || q === "hello" || q.includes("who are you") || q.includes("your name") || q.includes("what is your name")) {
      return `👋 Hello **${user.first_name}**! I am your **EduManage 360 AI Assistant** (Role: **${role.toUpperCase()}**).\n\nAsk me any question about your students, classes, attendance, exam rankings, or tuition fee status!`;
    }

    if (role === "admin") {
      const summary = contextData.admin_summary || {};
      if (q.includes("student") && (q.includes("fee") || q.includes("paid") || q.includes("unpaid") || q.includes("haven't") || q.includes("overdue") || q.includes("settle"))) {
        const unpaid = summary.unpaid_students || [];
        if (unpaid.length === 0) {
          return "🎉 **All tuition fees are up to date!** There are currently 0 students with unpaid or overdue fees.";
        }
        const names = unpaid.map((s) => `• **${s.student_name}** (${s.student_number}) — LKR ${(s.amount || 0).toLocaleString()} for **${s.course_name}** (${s.month}, Status: **${s.status.toUpperCase()}**)`).join("\n");
        return `💳 **Unpaid & Overdue Tuition Fee Summary:**\n\nThere are **${unpaid.length} student(s)** with outstanding or overdue fees:\n\n${names}`;
      }

      if (q.includes("attendance") || q.includes("class")) {
        const attHealth = summary.attendance_health || {};
        return `📊 **Class & Attendance Overview:**\n\n• Total Active Classes: **${summary.total_classes || 0}**\n• Total Students: **${summary.student_count || 0}**\n• Total Teachers: **${summary.teacher_count || 0}**\n• Overall Attendance Rate: **${attHealth.overall_attendance_rate || "92%"}** (${attHealth.present_logs || 0}/${attHealth.total_logs || 0} session marks logged).`;
      }

      return `🎓 **EduManage 360 System Overview for Admin (${user.first_name}):**\n\n• **Total Registered Users:** ${summary.total_users || 0}\n  - Students: ${summary.student_count || 0}\n  - Teachers: ${summary.teacher_count || 0}\n  - Parents: ${summary.parent_count || 0}\n• **Total Active Classes:** ${summary.total_classes || 0}\n• **Unpaid Fee Invoices:** ${summary.unpaid_fees_count || 0}\n• **Overdue Fee Invoices:** ${summary.overdue_fees_count || 0}`;
    }

    if (role === "teacher") {
      const summary = contextData.teacher_summary || {};
      if (q.includes("fail") || q.includes("exam") || q.includes("result")) {
        const exams = summary.exam_performance || [];
        if (exams.length === 0) {
          return "📋 No exam performance records currently logged for your courses.";
        }
        let report = "📝 **Exam Performance & Failed Students Report:**\n\n";
        exams.forEach((ex) => {
          report += `• **${ex.exam_title}** (${ex.term}): Total Students: ${ex.total_students}, Passed: ${ex.passed_count}, Failed: ${ex.failed_count} (Avg Score: ${ex.average_score}%)\n`;
          if (ex.failed_students.length > 0) {
            ex.failed_students.forEach((fs) => {
              report += `  - ${fs.student_name}: Marks: ${fs.marks} (${fs.grade})\n`;
            });
          }
        });
        return report;
      }
      return `👨‍🏫 **Teacher Summary for ${user.first_name}:**\n\n• Assigned Courses: ${summary.assigned_classes?.length || 0}\n• Total Sessions Conducted: ${summary.total_sessions || 0}\n• Total Exams Created: ${summary.total_exams_conducted || 0}`;
    }

    if (role === "student") {
      const summary = contextData.student_summary || {};
      if (q.includes("fee") || q.includes("paid") || q.includes("payment")) {
        const fees = summary.fees_history || [];
        if (fees.length === 0) return "💳 You have no fee invoices logged.";
        const feeList = fees.map((f) => `• ${f.course_name} (${f.month}): LKR ${f.amount} — **${f.status.toUpperCase()}**`).join("\n");
        return `💳 **Your Tuition Fee History (${summary.student_number}):**\n\n${feeList}`;
      }

      if (q.includes("exam") || q.includes("result") || q.includes("marks") || q.includes("grade")) {
        const results = summary.exam_results || [];
        if (results.length === 0) return "📝 You have no exam results published yet.";
        const resList = results.map((r) => `• ${r.exam_title} (${r.term}): ${r.marks_obtained}/${r.total_marks} Marks — Grade: **${r.grade}** (Rank: #${r.rank})`).join("\n");
        return `📊 **Your Exam Performance:**\n\n${resList}`;
      }

      const att = summary.attendance_summary || {};
      return `🎒 **Student Progress Summary for ${user.first_name} (${summary.student_number}):**\n\n• Enrolled Classes: ${summary.enrolled_classes?.length || 0}\n• Exam Results Logged: ${summary.exam_results?.length || 0}\n• Fee Invoices: ${summary.fees_history?.length || 0}\n• Class Attendance Rate: **${att.attendance_rate || "0%"}** (${att.present || 0} Present out of ${att.total_sessions || 0} total sessions).`;
    }

    if (role === "parent") {
      const summary = contextData.parent_summary || {};
      const children = summary.children || [];
      if (children.length === 0) {
        return "🔒 **No Linked Student Accounts:** No student profiles are currently linked to your parent account.";
      }

      // Check if user asked about a specific child by name or student number
      const matchedChild = children.find((c) => {
        const cName = (c.child_name || "").toLowerCase();
        const cNum = (c.student_number || "").toLowerCase();
        return q.includes(cName) || (cNum && q.includes(cNum)) || cName.split(" ").some((part) => part.length > 2 && q.includes(part));
      });

      if (matchedChild) {
        const feeText = matchedChild.unpaid_fees_count > 0
          ? `• **Tuition Fee Status:** ⚠️ ${matchedChild.unpaid_fees_count} pending/overdue fee invoice(s)`
          : `• **Tuition Fee Status:** ✅ All tuition fees are up to date`;

        let report = `🎒 **Student Progress Report for ${matchedChild.child_name} (${matchedChild.student_number}):**\n\n`;
        report += `• **Class Attendance Rate:** ${matchedChild.attendance.attendance_rate}\n`;
        report += `${feeText}\n`;
        if (matchedChild.exam_performance && matchedChild.exam_performance.length > 0) {
          report += `• **Exam Performance & Rankings:**\n`;
          matchedChild.exam_performance.forEach((ex) => {
            report += `  - ${ex.exam_title} (${ex.term}): ${ex.marks} Marks — Grade: **${ex.grade}** (Rank: #${ex.rank})\n`;
          });
        }
        return report;
      }

      const childrenNamesList = children.map((c) => `**${c.child_name}** (${c.student_number})`).join(", ");
      
      let childReport = `👨‍👩‍👧 **Parent Dashboard Overview for ${user.first_name}:**\n\nYou have **${children.length} registered child(ren)** linked to your account (${childrenNamesList}):\n\n`;
      children.forEach((c) => {
        childReport += `• **${c.child_name}** (${c.student_number}):\n  - Attendance Rate: **${c.attendance.attendance_rate}**\n  - Unpaid/Overdue Invoices: **${c.unpaid_fees_count}**\n  - Exam Results Logged: ${c.exam_performance.length}\n`;
      });
      return childReport;
    }

    return `🤖 Hello **${user.first_name}**! How can I assist you with EduManage 360 system data today?`;
  }
}

export default new ChatbotService();
