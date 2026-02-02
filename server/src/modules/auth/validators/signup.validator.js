//signup.validator.js
export const signupValidator = async (service, req, res, next) => {
  const { username, password } = req.body;

  if (!username || username.length < 3) {
    return res
      .status(400)
      .send({ ok: false, message: "Username is too short!" });
  }

  const exists = await service.findByUsername(username);
  if (exists) {
    return res
      .status(400)
      .send({ ok: false, message: "Username already taken" });
  }

  if (!password || password.length < 6) {
    return res
      .status(400)
      .send({ ok: false, message: "Password is too short!" });
  }

  return next();
};
