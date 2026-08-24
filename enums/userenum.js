 //User Roles Enum
 //Defines authorized system roles and parent relationship classifications.
export const USER_ROLES = {
  ADMIN: "admin",
  TEACHER: "teacher",
  STUDENT: "student",
  PARENT: "parent",
};

export const ROLE_VALUES = Object.values(USER_ROLES);

// Parent relationship classifications
export const RELATIONSHIP_TYPES = {
  FATHER: "father",
  MOTHER: "mother",
  GUARDIAN: "guardian",
};

export const RELATIONSHIP_VALUES = Object.values(RELATIONSHIP_TYPES);