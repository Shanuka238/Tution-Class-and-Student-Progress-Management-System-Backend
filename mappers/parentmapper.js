import { toUserDTO } from "./usermapper.js";

//Parent Data Transfer Object (DTO) Mapper
//Maps Parent entity and linked user profile.
export const toParentDTO = (parent, user = null) => {
  if (!parent) return null;
  const obj = parent.toObject ? parent.toObject() : parent;

  return {
    parent_id: obj._id.toString(),
    user_id: obj.user_id.toString(),
    occupation: obj.occupation,
    address: obj.address,
    relationship: obj.relationship,
    emergency_contact: obj.emergency_contact,
    created_at: obj.created_at,
    ...(user && { user: toUserDTO(user) }),
  };
};