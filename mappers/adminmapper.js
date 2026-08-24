import { toUserDTO } from "./usermapper.js";

//Admin Data Transfer Object (DTO) Mapper
//Maps Admin profile entity and associated user data.
export const toAdminDTO = (admin, user = null) => {
  if (!admin) return null;
  const obj = admin.toObject ? admin.toObject() : admin;

  return {
    admin_id: obj._id.toString(),
    user_id: obj.user_id.toString(),
    last_login: obj.last_login,
    created_at: obj.created_at,
    ...(user && { user: toUserDTO(user) }),
  };
};