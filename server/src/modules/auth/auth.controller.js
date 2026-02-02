export class AuthController {
  constructor(service) {
    this.service = service;
  }

  async signup(req, res) {
    const result = await this.service.createUser(req.body);
    res.status(201).send({ ok: true, payload: result });
  }
  async login(req, res) {
    const { password } = req.body;
    const user = req.user;

    const token = await this.service.generateToken(user, password);
    res.send({ ok: true, payload: token });
  }
  async getAuthUser(req, res) {
    const user = await this.service.getUserById(req.user.id);

    const { password, ...safeUser } = user.toJSON();

    res.send({ ok: true, payload: safeUser });
  }
  async changeUsername(req, res) {
    const { username, password } = req.body;
    const userId = req.user.id;

    const updatedUser = await this.service.updateUsername(
      userId,
      username,
      password
    );

    res.send({ ok: true, payload: updatedUser });
  }
  async changePrivacy(req, res) {
    const { isPrivate } = req.body;
    const id = req.user.id;

    const privacy = await this.service.updatePrivacy(id, isPrivate);
    res.send({ ok: true, payload: privacy });
  }
}
