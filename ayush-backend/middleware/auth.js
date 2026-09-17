import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Access denied. Authorization token missing." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "ayushcare_jwt_secret_key_2026",
    );
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired access token." });
  }
};
