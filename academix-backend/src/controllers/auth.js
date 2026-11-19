const jwt = require("jsonwebtoken");
const { identifyUsername } = require("../utils/identifyUserName");
const { verifyPassword } = require("../utils/password");
const { User } = require("../../models");

const AUTH_MODE = (process.env.AUTH_MODE || "ntlm").toLowerCase();
const secureCookies = process.env.HTTPS === "true";

exports.AUTH_MODE = AUTH_MODE;

// Pose les cookies de session (token JWT httpOnly + userInfo lisible par le front)
// puis renvoie { user, token } — même format qu'avant pour le frontend.
const issueSession = (res, username, result) => {
  res.cookie(
    "userInfo",
    JSON.stringify({
      username,
      name: result?.user?.name || username,
      id: result?.user?.id || null,
      militaryid: result?.user?.militaryid || null,
    }),
    {
      httpOnly: false,
      secure: secureCookies,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    }
  );

  res
    .cookie("token", result?.token, {
      httpOnly: true,
      secure: secureCookies,
      sameSite: "lax",
    })
    .json(result);
};

exports.getAuthMode = (req, res) => {
  res.json({ mode: AUTH_MODE });
};

exports.handleNTLMAuth = async (req, res) => {
  const ntlmData = req.ntlm;

  if (!ntlmData || !ntlmData.UserName) {
    res.status(401).json({ error: "NTLM failed" });
    return;
  }

  const result = await identifyUsername(ntlmData.UserName);
  issueSession(res, ntlmData.UserName, result);
};

exports.handleLocalLogin = async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    res.status(400).json({ error: "username and password are required" });
    return;
  }

  const user = await User.scope("withPassword").findOne({ where: { username } });
  const ok = user && (await verifyPassword(password, user.password));
  if (!ok) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const result = await identifyUsername(user.username);
  issueSession(res, user.username, result);
};

exports.handleMe = async (req, res) => {
  const token = req.cookies?.token;
  if (!token) {
    res.status(401).json({ error: "No token provided" });
    return;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      where: { username: decoded.username },
      attributes: ["id", "name", "militaryid", "username"],
    });
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    res.json({ user: user.get({ plain: true }) });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

exports.handleLogout = (req, res) => {
  res.clearCookie("token").clearCookie("userInfo").json({ ok: true });
};

exports.validateJWT = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ where: { username: decoded.username } });

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};
