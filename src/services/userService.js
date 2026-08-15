const store = require("../store");
const { verifyPassword } = require("../lib/passwordUtil");

function getPublicProfile(id) {
  const user = store.findUserById(id);
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    memberSince: user.memberSince,
  };
}

function getFullProfile(id) {
  return store.findUserById(id);
}

function getSanitizedProfile(id) {
  const user = store.findUserById(id);
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    memberSince: user.memberSince,
    orderHistory: (user.orderHistory || []).map(({ accessToken, ...order }) => order),
  };
}

function getProfileForApi(targetId, requestingUser) {
  if (!requestingUser) {
    return { error: "Authentication required", status: 401 };
  }
  const isOwner = String(requestingUser.id) === String(targetId);
  const isStaff = requestingUser.role === "ADMINISTRATOR";
  if (!isOwner && !isStaff) {
    return { error: "Forbidden", status: 403 };
  }
  const profile = getSanitizedProfile(targetId);
  if (!profile) {
    return { error: "User not found", status: 404 };
  }
  return { profile, status: 200 };
}

function authenticate(username, password) {
  const user = store.findUserByUsername(username);
  if (!user || !verifyPassword(password, user.password)) {
    return null;
  }
  return user;
}

module.exports = {
  getPublicProfile,
  getFullProfile,
  getSanitizedProfile,
  getProfileForApi,
  authenticate,
};