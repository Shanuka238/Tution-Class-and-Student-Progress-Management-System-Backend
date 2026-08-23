import StudentClass from "../models/studentclassmodel.js";

class StudentClassDAO {
  async enrollStudent(enrollmentData, session) {
    const [record] = await StudentClass.create([enrollmentData], { session });
    return record;
  }

  async findEnrollment(studentId, classId) {
    return await StudentClass.findOne({ student_id: studentId, class_id: classId });
  }

  async updateEnrollmentStatus(studentId, classId, status, session) {
    return await StudentClass.findOneAndUpdate(
      { student_id: studentId, class_id: classId },
      { $set: { status } },
      { new: true, session }
    );
  }

  async countActiveStudents(classId) {
    return await StudentClass.countDocuments({ class_id: classId, status: "active" });
  }

  async findClassesByStudent(studentId) {
    return await StudentClass.find({ student_id: studentId, status: "active" })
      .populate({
        path: "class_id"
      });
  }

  async findStudentsByClass(classId, status = "active") {
    const query = { class_id: classId };
    if (status) query.status = status;
    return await StudentClass.find(query);
  }

  async deleteByClassId(classId, session) {
    return await StudentClass.deleteMany({ class_id: classId }, { session });
  }
}

export default new StudentClassDAO();