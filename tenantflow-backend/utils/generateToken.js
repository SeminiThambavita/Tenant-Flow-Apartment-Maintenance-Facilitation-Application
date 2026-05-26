import jwt from "jsonwebtoken";

const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || "tenantflow_secret_key_2026",
    { expiresIn: "30d" }
  );
};

export default generateToken;
