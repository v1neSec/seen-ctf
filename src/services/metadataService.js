const flagService = require("./flagService");

function getInstanceMetadata() {
  return {
    instance_id: "i-0acme7f3a2b1c9d0e",
    region: "us-east-1",
    availability_zone: "us-east-1a",
    iam_credentials: {
      access_key_id: "AKIAACMEEXAMPLE",
      secret_access_key: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      session_token: flagService.getSlot("FLAG2"),
      expiration: "2026-12-31T23:59:59Z",
    },
    tags: { Name: "acme-shop-prod", Environment: "production" },
  };
}

module.exports = { getInstanceMetadata };
