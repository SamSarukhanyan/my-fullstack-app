export const loginValidator = async (service, req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .send({ ok: false, message: "Login and password required" });
  }

  const user = await service.findByUsername(username);
  if (!user) {
    return res.status(400).send({ ok: false, message: "User not found" });
  }

  req.user = user;

  return next();
};
