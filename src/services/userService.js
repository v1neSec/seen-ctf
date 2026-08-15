const store = require("../store");

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

function getProfileForApi(targetId, requestingUserId) {
  if (!requestingUserId) {
    return { error: "Authentication required", status: 401 };
  }
  const profile = getFullProfile(targetId);
  if (!profile) {
    return { error: "User not found", status: 404 };
  }
  return { profile, status: 200 };
}

function authenticate(username, password) {
  const user = store.findUserByUsername(username);
  if (!user || user.password !== password) {
    return null;
  }
  return user;
}

module.exports = {
  getPublicProfile,
  getFullProfile,
  getProfileForApi,
  authenticate,
};
