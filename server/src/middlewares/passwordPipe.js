import bcrypt from "bcrypt";

export const passwordHash = async (req, res, next) => {
  req.body.password = await bcrypt.hash(req.body.password, 10);
  next();
};
