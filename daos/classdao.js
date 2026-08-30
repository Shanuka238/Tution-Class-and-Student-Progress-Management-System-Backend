import Class from "../models/classmodel.js";

 //Class / Course Data Access Object (DAO)
 //Executes aggregation pipelines for class directories, student rosters, and teacher lookups.
class ClassDAO {
   //Insert new Class document in transaction session
  async create(classData, session) {
    const [newClass] = await Class.create([classData], { session });
    return newClass;
  }

  //Find class by MongoDB ID
  async findById(id) {
    return await Class.findById(id);
  }

  //Retrieve all active classes with populated student rosters and multi-teacher assignments
  async findAllActive() {
    return await Class.aggregate([
      { $match: { is_active: true } },
      {
        $lookup: {
          from: "studentclasses",
          let: { classId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$class_id", "$$classId"] }, status: "active" } },
            {
              $lookup: {
                from: "students",
                localField: "student_id",
                foreignField: "_id",
                as: "student_data"
              }
            },
            { $unwind: { path: "$student_data", preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: "users",
                localField: "student_data.user_id",
                foreignField: "_id",
                as: "student_data.user_data"
              }
            },
            { $unwind: { path: "$student_data.user_data", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                id: "$student_data._id",
                student_number: "$student_data.student_number",
                name: { $concat: ["$student_data.user_data.first_name", " ", "$student_data.user_data.last_name"] },
                email: "$student_data.user_data.email"
              }
            }
          ],
          as: "enrolled_students"
        }
      },
      {
        $lookup: {
          from: "teachers",
          let: { teacherIds: { $ifNull: ["$teachers", []] }, singleTeacherId: "$teacher_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $in: ["$_id", "$$teacherIds"] },
                    { $eq: ["$_id", "$$singleTeacherId"] }
                  ]
                }
              }
            },
            {
              $lookup: {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user_data"
              }
            },
            { $unwind: { path: "$user_data", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                id: "$_id",
                teacher_number: "$teacher_number",
                name: { $concat: ["$user_data.first_name", " ", "$user_data.last_name"] },
                email: "$user_data.email"
              }
            }
          ],
          as: "teacher_data_list"
        }
      },
      {
        $addFields: {
          teachers_data: "$teacher_data_list",
          teacher_data: { $arrayElemAt: ["$teacher_data_list", 0] },
          current_enrollment: { $size: "$enrolled_students" }
        }
      }
    ]);
  }

  //Find all active classes taught by a specific teacher
  async findByTeacherId(teacherId) {
    return await Class.find({
      $or: [
        { teacher_id: teacherId },
        { teachers: teacherId }
      ],
      is_active: true
    }).populate("teacher_id");
  }

  //Check for schedule overlaps for a teacher
  async findTeacherConflict(teacherId, startDate, endDate) {
    return await Class.findOne({
      $or: [
        { teacher_id: teacherId },
        { teachers: teacherId }
      ],
      is_active: true,
      $or: [
        { start_date: { $lte: endDate, $gte: startDate } },
        { end_date: { $lte: endDate, $gte: startDate } },
      ],
    });
  }

  // Update class document by ID
  async updateById(id, updateData) {
    return await Class.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
  }

  // Deactivate/soft-delete a class by ID
  async softDelete(id) {
    return await Class.findByIdAndUpdate(
      id,
      { is_active: false },
      { new: true }
    );
  }

  // Delete class document by ID
  async deleteById(id, session = null) {
    const options = {};
    if (session) options.session = session;
    return await Class.findByIdAndDelete(id, options);
  }
}

export default new ClassDAO();