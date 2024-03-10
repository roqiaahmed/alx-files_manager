import { describe, it } from "mocha";
import { expect } from "chai";
import request from "supertest";

describe("GET /users/me", () => {
  it("should return current user details if token is valid", async () => {
    // Assuming you have a valid token in token variable
    const response = await request(app).get("/users/me").set("x-token", token);
    expect(response.status).to.equal(200);
    expect(response.body).to.have.property("id");
    expect(response.body).to.have.property("email");
  });

  it("should return status 401 if token is missing", async () => {
    const response = await request(app).get("/users/me");
    expect(response.status).to.equal(401);
  });

  it("should return status 401 if token is invalid", async () => {
    const response = await request(app)
      .get("/users/me")
      .set("x-token", "invalidtoken");
    expect(response.status).to.equal(401);
  });
});
