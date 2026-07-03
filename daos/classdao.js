import Class from "../models/classmodel.js";

class ClassDAO {
  async create(classData, session) {
    const [newClass] = await Class.create([classData], { session });
    return newClass;
  }

  async findById(id) {
    return await Class.findById(id).populate({
      path: "teacher_id",
      populate: { path: "user_id", select: "first_name last_name email" }
    });
  }

  async findAllActive() {
    return await Class.aggregate([
      { $match: { is_active: true } },
      {
        $lookup: {
          from: "teachers",
          localField: "teacher_id",
          foreignField: "_id",
          as: "teacher_id"
        }
      },
      { $unwind: { path: "$teacher_id", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "teacher_id.user_id",
          foreignField: "_id",
          as: "teacher_id.user_id"
        }
      },
      { $unwind: { path: "$teacher_id.user_id", preserveNullAndEmptyArrays: true } },
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
        $addFields: {
          enrolled_count: { $size: "$enrolled_students" }
        }
      },
      { $sort: { created_at: -1 } }
    ]);
  }

  async findScheduleConflict(teacherId, venue, day, startTime, endTime, excludeClassId = null) {
    const query = {
      is_active: true,
      schedule_days: day,
      schedule_start_time: { $lt: endTime },
      schedule_end_time: { $gt: startTime },
      $or: [
        { venue: venue },
        { teacher_id: teacherId }
      ]
    };

    if (excludeClassId) {
      query._id = { $ne: excludeClassId };
    }

    return await Class.findOne(query);
  }

  async update(id, updateData, session) {
    return await Class.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true, session }
    );
  }

  async deleteById(id, session) {
    return await Class.findByIdAndDelete(id, { session });
  }

  async findTimetable(query) {
    return await Class.find(query)
      .populate({
        path: "teacher_id",
        populate: { path: "user_id", select: "first_name last_name email" }
      })
      .sort({ schedule_days: 1, schedule_start_time: 1 });
  }
}

export default new ClassDAO();