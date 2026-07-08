export const toAttendanceDTO = (attendance) => {
  if (!attendance) return null;
  const obj = attendance.toObject ? attendance.toObject() : attendance;

  return {
    ...obj,
    _id: obj._id ? obj._id.toString() : obj.id,
    attendance_id: obj._id ? obj._id.toString() : obj.id,
  };
};

export const toAttendanceRegisterDTO = (session, attendanceRecords) => {
  if (!session) return null;
  const sessionObj = session.toObject ? session.toObject() : session;
  
  // Filter attendance records to only include those belonging to this session
  const sessionAttendance = attendanceRecords.filter(
    (record) => record.session_id.toString() === sessionObj._id.toString()
  );

  return {
    ...sessionObj,
    _id: sessionObj._id ? sessionObj._id.toString() : sessionObj.id,
    session_id: sessionObj._id ? sessionObj._id.toString() : sessionObj.id,
    attendance: sessionAttendance.map(toAttendanceDTO)
  };
};
