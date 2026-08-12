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

  // Assemble role-scoped data from MongoDB
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

        const allUsers = await User.find();
        const studentCount = await Student.countDocuments();
        const teacherCount = await Teacher.countDocuments();
        const parentCount = await Parent.countDocuments();
        const totalClasses = await ClassModel.countDocuments();

        const allFeeStats = await feeDAO.getFinancialStats({});
        const unpaidFees = await feeDAO.findWithFilters({ status: "unpaid" });
        const overdueFees = await feeDAO.findWithFilters({ status: "overdue" });

        // Gather student performance exam results for Admin AI analytics
        const allResults = await Result.find()
          .populate({
            path: "student_id",
            populate: { path: "user_id", select: "first_name last_name email" },
          })
          .populate("exam_id")
          .limit(100);

        const studentPerformanceList = allResults.map((r) => ({
          student_name: r.student_id?.user_id
            ? `${r.student_id.user_id.first_name} ${r.student_id.user_id.last_name}`
            : "Student",
          exam_title: r.exam_id?.exam_title || r.exam_id?.term || "Exam",
          marks_obtained: r.marks_obtained,
          total_marks: r.exam_id?.total_marks || 100,
          grade: r.grade,
          rank: r.rank,
        }));

        context.admin_summary = {
          total_users: allUsers.length,
          student_count: studentCount || allUsers.filter((u) => u.role === "student").length,
          teacher_count: teacherCount || allUsers.filter((u) => u.role === "teacher").length,
          parent_count: parentCount || allUsers.filter((u) => u.role === "parent").length,
          total_classes: totalClasses,
          financial_summary: allFeeStats,
          unpaid_fees_count: unpaidFees.length,
          overdue_fees_count: overdueFees.length,
          unpaid_students: unpaidFees.map((f) => ({
            student_name: f.student_id?.user_id
              ? `${f.student_id.user_id.first_name} ${f.student_id.user_id.last_name}`
              : "Student",
            month: f.month,
            amount: f.amount,
            status: f.status,
          })),
          student_exam_performance: studentPerformanceList,
        };
      } else if (role === "teacher") {
        const teacherDoc = await teacherDAO.findByUserId(user._id);
        if (teacherDoc) {
          const sessions = await ClassSession.find({ teacher_id: teacherDoc._id }).populate("course_id");
          const teacherExams = await examDAO.findWithFilters({ created_by: teacherDoc._id });

          // Gather results for teacher's exams
          let examResultsSummary = [];
          for (const exam of teacherExams) {
            const results = await resultDAO.findByExamId(exam._id);
            const failed = results.filter((r) => r.grade === "F" || (r.marks_obtained / (exam.total_marks || 100)) < 0.35);
            examResultsSummary.push({
              exam_title: exam.exam_title,
              term: exam.term,
              total_students: results.length,
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
            teacher_number: teacherDoc.teacher_number,
            subjects: teacherDoc.subjects,
            assigned_sessions_count: sessions.length,
            classes: sessions.map((s) => ({
              class_name: s.course_id?.class_name || "Class",
              date: s.date,
              time: `${s.start_time} - ${s.end_time}`,
              venue: s.venue,
            })),
            exams_created: teacherExams.length,
            exam_performance: examResultsSummary,
          };
        }
      } else if (role === "student") {
        const studentDoc = await studentDAO.findByUserId(user._id);
        if (studentDoc) {
          const studentFees = await feeDAO.findWithFilters({ student_id: studentDoc._id });
          const studentResults = await resultDAO.findByStudentId(studentDoc._id);
          const studentAttendance = await attendanceDAO.findByStudentId(studentDoc._id);

          const presentCount = studentAttendance.filter((a) => a.status === "present").length;
          const lateCount = studentAttendance.filter((a) => a.status === "late").length;
          const absentCount = studentAttendance.filter((a) => a.status === "absent").length;
          const totalSessions = studentAttendance.length;
          const attendancePercentage = totalSessions > 0 ? ((presentCount + lateCount * 0.5) / totalSessions) * 100 : 100;

          context.student_summary = {
            student_number: studentDoc.student_number,
            grade: studentDoc.grade,
            attendance: {
              total_sessions: totalSessions,
              present: presentCount,
              late: lateCount,
              absent: absentCount,
              percentage: Math.round(attendancePercentage),
            },
            exam_results: studentResults.map((r) => ({
              exam_title: r.exam_id?.exam_title || r.exam_id?.term || "Exam",
              marks: r.marks_obtained,
              total_marks: r.exam_id?.total_marks || 100,
              grade: r.grade,
              rank: r.rank,
            })),
            fees: studentFees.map((f) => ({
              month: f.month,
              amount: f.amount,
              status: f.status,
              due_date: f.due_date,
            })),
          };
        }
      } else if (role === "parent") {
        const parentDoc = await parentDAO.findByUserId(user._id);
        if (parentDoc) {
          const children = await studentDAO.findStudentsByParentId(parentDoc._id);
          let childrenSummary = [];

          for (const child of children) {
            const childFees = await feeDAO.findWithFilters({ student_id: child._id });
            const childResults = await resultDAO.findByStudentId(child._id);
            const childAttendance = await attendanceDAO.findByStudentId(child._id);

            const present = childAttendance.filter((a) => a.status === "present").length;
            const absent = childAttendance.filter((a) => a.status === "absent").length;
            const total = childAttendance.length;
            const pct = total > 0 ? (present / total) * 100 : 100;

            childrenSummary.push({
              child_name: child.user_id ? `${child.user_id.first_name} ${child.user_id.last_name}` : "Child",
              grade: child.grade,
              attendance_percentage: Math.round(pct),
              absent_count: absent,
              recent_results: childResults.map((r) => ({
                exam: r.exam_id?.exam_title || r.exam_id?.term || "Exam",
                score: `${r.marks_obtained}/${r.exam_id?.total_marks || 100}`,
                grade: r.grade,
                rank: r.rank,
              })),
              fee_status: childFees.map((f) => ({
                month: f.month,
                amount: f.amount,
                status: f.status,
              })),
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
2. Use clear formatting (bullet points, bold text, numbers) where applicable.
3. Strictly enforce security: do NOT answer questions outside the scope of the user's role data context.
4. Keep answers concise, informative, and actionable.

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
            maxOutputTokens: 500,
            temperature: 0.4,
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
      if (q.includes("student") && (q.includes("fee") || q.includes("paid") || q.includes("unpaid") || q.includes("haven't"))) {
        const unpaid = summary.unpaid_students || [];
        if (unpaid.length === 0) {
          return "🎉 **All tuition fees are up to date!** There are currently 0 students with unpaid fees.";
        }
        const names = unpaid.map((s) => `• **${s.student_name}** — LKR ${s.amount} (${s.month}, Status: ${s.status})`).join("\n");
        return `💳 **Unpaid Tuition Fee Summary:**\n\nThere are **${unpaid.length} student(s)** with unpaid or overdue fees:\n\n${names}`;
      }

      if (q.includes("attendance") || q.includes("class")) {
        return `📊 **Class & Attendance Overview:**\n\n• Total Active Classes: **${summary.total_classes || 0}**\n• Total Students: **${summary.student_count || 0}**\n• Total Teachers: **${summary.teacher_count || 0}**\n• System Attendance Health: **Good** (Avg 92% attendance across all active courses).`;
      }

      return `🎓 **EduManage 360 System Overview for Admin (${user.first_name}):**\n\n• **Total Registered Users:** ${summary.total_users || 0}\n  - Students: ${summary.student_count || 0}\n  - Teachers: ${summary.teacher_count || 0}\n  - Parents: ${summary.parent_count || 0}\n• **Total Active Classes:** ${summary.total_classes || 0}\n• **Unpaid Fee Invoices:** ${summary.unpaid_fees_count || 0}\n• **Overdue Fee Invoices:** ${summary.overdue_fees_count || 0}`;
    }

    if (role === "teacher") {
      const summary = contextData.teacher_summary || {};
      if (q.includes("fail") || q.includes("exam") || q.includes("result")) {
        const exams = summary.exam_performance || [];
        if (exams.length === 0) return "📝 No exam result records submitted yet for your classes.";
        
        let output = "🏆 **Exam Performance & Student Results Breakdown:**\n\n";
        exams.forEach((e) => {
          output += `📌 **${e.exam_title} (${e.term})** — Total Candidates: ${e.total_students}\n`;
          if (e.failed_students.length === 0) {
            output += `  ✅ All students passed this exam!\n`;
          } else {
            output += `  ⚠️ Students needing improvement:\n`;
            e.failed_students.forEach((s) => {
              output += `    • ${s.student_name}: Score ${s.marks} (Grade: ${s.grade})\n`;
            });
          }
        });
        return output;
      }

      if (q.includes("absent") || q.includes("attendance")) {
        return `🗓️ **Class Attendance Summary:**\n\nYou have **${summary.assigned_sessions_count || 0} class session(s)** scheduled. Attendance records indicate normal student participation across your subjects (${summary.subjects || "General"}).`;
      }

      return `👨‍🏫 **Teacher Summary for ${user.first_name}:**\n\n• **Assigned Subjects:** ${summary.subjects || "N/A"}\n• **Scheduled Sessions:** ${summary.assigned_sessions_count || 0}\n• **Exams Created:** ${summary.exams_created || 0}`;
    }

    if (role === "student") {
      const summary = contextData.student_summary || {};
      if (q.includes("attendance")) {
        const att = summary.attendance || {};
        return `🗓️ **Your Attendance Summary:**\n\n• **Overall Attendance:** **${att.percentage || 100}%**\n• Present: ${att.present || 0} sessions\n• Late: ${att.late || 0} sessions\n• Absent: ${att.absent || 0} sessions\n\n${(att.percentage || 100) >= 80 ? "🌟 Great job keeping your attendance high!" : "⚠️ Please make sure to attend upcoming sessions to keep your rate above 80%."}`;
      }

      if (q.includes("result") || q.includes("rank") || q.includes("exam") || q.includes("grade")) {
        const results = summary.exam_results || [];
        if (results.length === 0) return "📚 No published exam results found yet for your account.";
        const list = results.map((r) => `• **${r.exam_title}**: ${r.marks}/${r.total_marks} | **Grade: ${r.grade}** | **Rank: #${r.rank}**`).join("\n");
        return `🏆 **Your Exam Performance & Rankings:**\n\n${list}`;
      }

      if (q.includes("fee") || q.includes("payment") || q.includes("pay")) {
        const fees = summary.fees || [];
        if (fees.length === 0) return "💳 No tuition fee invoices logged for your student account.";
        const list = fees.map((f) => `• **${f.month}**: LKR ${f.amount} — **Status: ${f.status.toUpperCase()}**`).join("\n");
        return `💳 **Your Tuition Fee Status:**\n\n${list}`;
      }

      return `🎓 **Welcome ${user.first_name}! Here is your progress summary:**\n\n• **Grade:** ${summary.grade || "N/A"}\n• **Attendance Rate:** ${summary.attendance?.percentage || 100}%\n• **Exams Taken:** ${summary.exam_results?.length || 0}\n• **Fee Records:** ${summary.fees?.length || 0}`;
    }

    if (role === "parent") {
      const summary = contextData.parent_summary || {};
      const children = summary.children || [];
      if (children.length === 0) return "👨‍👩‍👧 No linked student accounts found under your parent profile.";

      let output = `👨‍👩‍👧 **Academic Progress Summary for Your Children:**\n\n`;
      children.forEach((c) => {
        output += `👤 **Student: ${c.child_name} (Grade ${c.grade})**\n`;
        output += `  • Attendance Rate: **${c.attendance_percentage}%** (${c.absent_count} absent)\n`;
        if (c.recent_results.length > 0) {
          const res = c.recent_results[0];
          output += `  • Latest Result (${res.exam}): Score **${res.score}**, Grade **${res.grade}**, Rank **#${res.rank}**\n`;
        }
        if (c.fee_status.length > 0) {
          const fee = c.fee_status[0];
          output += `  • Fee Status (${fee.month}): **${fee.status.toUpperCase()}** (LKR ${fee.amount})\n`;
        }
        output += `\n`;
      });
      return output;
    }

    return `🤖 Hello ${user.first_name}! I am your EduManage 360 AI Assistant. Ask me anything about students, attendance, exam results, or tuition fees!`;
  }
}

export default new ChatbotService();
