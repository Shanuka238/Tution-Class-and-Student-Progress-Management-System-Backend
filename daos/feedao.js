import Fee from "../models/feemodel.js";
import { FEE_STATUS } from "../enums/feeenum.js";

 //Tuition Fee Data Access Object (DAO)
 //Manages billing queries, overdue status sync, and financial analytics aggregations.
class FeeDAO {

   //Insert new fee record
  async create(feeData) {
    const fee = new Fee(feeData);
    return await fee.save();
  }

   //Bulk insert generated student billing invoices
  async bulkCreate(records) {
    return await Fee.insertMany(records);
  }

   //Find fee by ID with populated student and course details
  async findById(id) {
    return await Fee.findById(id)
      .populate({
        path: "student_id",
        populate: { path: "user_id", select: "first_name last_name email" }
      })
      .populate("class_id");
  }

  //Find fees matching filter criteria
  async findWithFilters(filters = {}) {
    return await Fee.find(filters)
      .populate({
        path: "student_id",
        populate: { path: "user_id", select: "first_name last_name email student_number" }
      })
      .populate("class_id")
      .sort({ created_at: -1 });
  }

  //Update fee document by ID
  async update(id, updateData) {
    return await Fee.findByIdAndUpdate(id, updateData, { new: true })
      .populate({
        path: "student_id",
        populate: { path: "user_id", select: "first_name last_name email" }
      })
      .populate("class_id");
  }

  //Calculate financial revenue, collection, and outstanding metrics
  async getFinancialStats(filters = {}) {
    const now = new Date();
    await Fee.updateMany(
      { status: FEE_STATUS.UNPAID, due_date: { $lt: now } },
      { $set: { status: FEE_STATUS.OVERDUE } }
    );

    const match = {};
    if (filters.class_id) {
      match.class_id = filters.class_id;
    }

    const stats = await Fee.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $cond: [{ $eq: ["$status", FEE_STATUS.PAID] }, "$amount", 0]
            }
          },
          pendingAmount: {
            $sum: {
              $cond: [{ $in: ["$status", [FEE_STATUS.UNPAID, FEE_STATUS.OVERDUE]] }, "$amount", 0]
            }
          },
          paidCount: {
            $sum: {
              $cond: [{ $eq: ["$status", FEE_STATUS.PAID] }, 1, 0]
            }
          },
          unpaidCount: {
            $sum: {
              $cond: [{ $eq: ["$status", FEE_STATUS.UNPAID] }, 1, 0]
            }
          },
          overdueCount: {
            $sum: {
              $cond: [{ $eq: ["$status", FEE_STATUS.OVERDUE] }, 1, 0]
            }
          },
          totalInvoicesCount: { $sum: 1 }
        }
      }
    ]);

    const result = stats[0] || {
      totalRevenue: 0,
      pendingAmount: 0,
      paidCount: 0,
      unpaidCount: 0,
      overdueCount: 0,
      totalInvoicesCount: 0
    };

    return {
      totalRevenue: result.totalRevenue || 0,
      pendingAmount: result.pendingAmount || 0,
      paidCount: result.paidCount || 0,
      unpaidCount: result.unpaidCount || 0,
      overdueCount: result.overdueCount || 0,
      paidInvoicesCount: result.paidCount || 0,
      unpaidInvoicesCount: (result.unpaidCount || 0) + (result.overdueCount || 0),
      overdueInvoicesCount: result.overdueCount || 0,
      totalInvoicesCount: result.totalInvoicesCount || 0,
      collectionRate: (result.totalInvoicesCount || 0) > 0 
        ? Math.round(((result.paidCount || 0) / result.totalInvoicesCount) * 100) 
        : 0
    };
  }


  //Automatically transition unpaid fees past their due date to overdue
  async syncOverdueStatuses() {
    const now = new Date();
    await Fee.updateMany(
      { status: FEE_STATUS.UNPAID, due_date: { $lt: now } },
      { $set: { status: FEE_STATUS.OVERDUE } }
    );
  }
}

export default new FeeDAO();
