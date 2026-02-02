export const changeUsernameValidator = async (req, res, next) => {
  const { username, password } = req.body;

  if (!username.trim() || !password.trim()) {
    return res.status(400).send({ ok: false, message: "missing fields" });
  }
  if (username.length < 6) {
    return res.status(400).send({
      ok: false,
      message: "The username entered must be at least 6 characters long.",
    });
  }

  return next();
};
