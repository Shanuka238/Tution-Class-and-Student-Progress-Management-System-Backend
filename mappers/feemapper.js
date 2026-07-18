export const toFeeDTO = (fee) => {
  if (!fee) return null;
  const obj = fee.toObject ? fee.toObject() : fee;

  let studentData = null;
  if (obj.student_id) {
    const studentObj = obj.student_id.toObject ? obj.student_id.toObject() : obj.student_id;
    let userData = null;
    if (studentObj.user_id) {
      const userObj = studentObj.user_id.toObject ? studentObj.user_id.toObject() : studentObj.user_id;
      userData = {
        first_name: userObj.first_name,
        last_name: userObj.last_name,
        email: userObj.email,
      };
    }
    studentData = {
      _id: studentObj._id ? studentObj._id.toString() : studentObj.student_id,
      student_number: studentObj.student_number,
      user_id: userData,
    };
  }

  let classData = null;
  if (obj.class_id) {
    const classObj = obj.class_id.toObject ? obj.class_id.toObject() : obj.class_id;
    classData = {
      _id: classObj._id ? classObj._id.toString() : classObj.class_id,
      class_name: classObj.class_name,
      subject: classObj.subject,
      grade: classObj.grade,
    };
  }

  return {
    fee_id: obj._id ? obj._id.toString() : obj.fee_id,
    student_id: studentData,
    class_id: classData,
    month: obj.month,
    amount: obj.amount,
    status: obj.status,
    due_date: obj.due_date,
    paid_date: obj.paid_date,
    payment_method: obj.payment_method,
    payment_id: obj.payment_id,
    receipt_url: obj.receipt_url,
    created_at: obj.created_at,
  };
};

export const toFeeListDTO = (fees) => {
  if (!Array.isArray(fees)) return [];
  return fees.map(toFeeDTO);
};
