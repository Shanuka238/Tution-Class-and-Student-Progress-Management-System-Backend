import Class from "../models/classmodel.js";

class ClassDAO {
  async create(classData, session) {
    const [newClass] = await Class.create([classData], { session });
    return newClass;
  }

  async findById(id) {
    return await Class.findById(id);
  }

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
                _id: 1,
                teacher_id: "$_id",
                subjects: 1,
                user_id: {
                  _id: "$user_data._id",
                  first_name: "$user_data.first_name",
                  last_name: "$user_data.last_name",
                  email: "$user_data.email",
                  phone: "$user_data.phone"
                }
              }
            }
          ],
          as: "assigned_teachers"
        }
      },
      {
        $addFields: {
          enrolled_count: { $size: "$enrolled_students" },
          teachers: "$assigned_teachers",
          teacher_id: {
            $cond: {
              if: { $gt: [{ $size: "$assigned_teachers" }, 0] },
              then: { $arrayElemAt: ["$assigned_teachers", 0] },
              else: null
            }
          }
        }
      },
      { $sort: { created_at: -1 } }
    ]);
  }

  async findScheduleConflict(venue, day, startTime, endTime, excludeClassId = null) {
    const query = {
      is_active: true,
      schedule_days: day,
      schedule_start_time: { $lt: endTime },
      schedule_end_time: { $gt: startTime },
      venue: venue
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
      .sort({ schedule_days: 1, schedule_start_time: 1 });
  }
}

export default new ClassDAO();