
function getInstanceMetadata() {
  return {
    instance_id: "i-0acme7f3a2b1c9d0e",
    region: "us-east-1",
    availability_zone: "us-east-1a",
    tags: { Name: "acme-shop-prod", Environment: "production" },
  };
}

module.exports = { getInstanceMetadata };