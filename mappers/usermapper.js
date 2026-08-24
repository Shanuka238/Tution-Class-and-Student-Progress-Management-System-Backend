
//User Data Transfer Object (DTO) Mapper
//Sanitizes MongoDB User document by removing hashed passwords and internal fields.

export const toUserDTO = (user) => {
  if (!user) return null;
  const userObj = user.toObject ? user.toObject() : user;
  
  // Remove sensitive internal data
  delete userObj.password;
  delete userObj.__v;

  return {
    user_id: userObj._id.toString(),
    first_name: userObj.first_name,
    last_name: userObj.last_name,
    email: userObj.email,
    role: userObj.role,
    phone: userObj.phone,
    profile_image: userObj.profile_image,
    is_active: userObj.is_active,
    created_at: userObj.created_at,
  };
};