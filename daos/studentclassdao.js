import StudentClass from "../models/studentclassmodel.js";

 //Student Class Enrollment DAO
 //Database access for student-to-course enrollments and active roster counts.
class StudentClassDAO {
  //Insert new course enrollment record
  async enrollStudent(enrollmentData, session) {
    const [record] = await StudentClass.create([enrollmentData], { session });
    return record;
  }

  //Find enrollment record by student ID and class ID
  async findEnrollment(studentId, classId) {
    return await StudentClass.findOne({ student_id: studentId, class_id: classId });
  }

  //Update enrollment status (active, dropped) in transaction
  async updateEnrollmentStatus(studentId, classId, status, session) {
    return await StudentClass.findOneAndUpdate(
      { student_id: studentId, class_id: classId },
      { $set: { status } },
      { new: true, session }
    );
  }

  //Count number of currently active students enrolled in a class
  async countActiveStudents(classId) {
    return await StudentClass.countDocuments({ class_id: classId, status: "active" });
  }

  //Find all active classes a student is enrolled in
  async findClassesByStudent(studentId) {
    return await StudentClass.find({ student_id: studentId, status: "active" })
      .populate({
        path: "class_id"
      });
  }

  //Find all student enrollments for a class
  async findStudentsByClass(classId, status = "active") {
    const query = { class_id: classId };
    if (status) query.status = status;
    return await StudentClass.find(query);
  }

  //Delete all student enrollments associated with a class ID
  async deleteByClassId(classId, session) {
    return await StudentClass.deleteMany({ class_id: classId }, { session });
  }
}

export default new StudentClassDAO();