import Fee from "../models/feemodel.js";
import { FEE_STATUS } from "../enums/feeenum.js";

class FeeDAO {
  async create(feeData) {
    const fee = new Fee(feeData);
    return await fee.save();
  }

  async bulkCreate(records) {
    return await Fee.insertMany(records);
  }

  async findById(id) {
    return await Fee.findById(id)
      .populate({
        path: "student_id",
        populate: { path: "user_id", select: "first_name last_name email" }
      })
      .populate("class_id");
  }

  async findWithFilters(filters = {}) {
    return await Fee.find(filters)
      .populate({
        path: "student_id",
        populate: { path: "user_id", select: "first_name last_name email student_number" }
      })
      .populate("class_id")
      .sort({ created_at: -1 });
  }

  async update(id, updateData) {
    return await Fee.findByIdAndUpdate(id, updateData, { new: true })
      .populate({
        path: "student_id",
        populate: { path: "user_id", select: "first_name last_name email" }
      })
      .populate("class_id");
  }

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
          }
        }
      }
    ]);

    const defaultStats = {
      totalRevenue: 0,
      pendingAmount: 0,
      paidCount: 0,
      unpaidCount: 0,
      overdueCount: 0
    };

    return stats[0] || defaultStats;
  }

  async syncOverdueStatuses() {
    const now = new Date();
    return await Fee.updateMany(
      { status: FEE_STATUS.UNPAID, due_date: { $lt: now } },
      { $set: { status: FEE_STATUS.OVERDUE } }
    );
  }
}

export default new FeeDAO();
