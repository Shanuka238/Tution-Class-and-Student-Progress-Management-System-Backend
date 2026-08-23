import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import Attendance from "../models/attendancemodel.js";
import ClassSession from "../models/classsessionmodel.js";

dns.setServers([
  '1.1.1.1',
  '8.8.8.8'
]);

dotenv.config();

const runMigration = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected successfully!");

    console.log("Fetching attendance records...");
    const attendanceRecords = await Attendance.find({
      session_id: { $exists: false }
    });

    console.log(`Found ${attendanceRecords.length} records to migrate.`);

    for (let record of attendanceRecords) {
      if (!record.class_id || !record.date) {
        console.log(`Skipping record ${record._id}: missing class_id or date`);
        continue;
      }

      // Find or create session for class_id and date
      const startOfDay = new Date(record.date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(record.date);
      endOfDay.setHours(23, 59, 59, 999);

      let session = await ClassSession.findOne({
        course_id: record.class_id,
        date: { $gte: startOfDay, $lte: endOfDay }
      });

      if (!session) {
        session = await ClassSession.create({
          course_id: record.class_id,
          date: record.date,
          status: "held",
          created_by: record.marked_by
        });
        console.log(`Created new ClassSession ${session._id} for course ${record.class_id} on ${record.date}`);
      }

      record.session_id = session._id;
      await record.save();
      console.log(`Migrated attendance record ${record._id} -> session ${session._id}`);
    }

    console.log("Migration complete!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

runMigration();
