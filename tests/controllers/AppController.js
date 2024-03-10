import { describe, it } from "mocha";
import { expect } from "chai";
import request from "supertest";

describe("AppController", () => {
  describe("GET /status", () => {
    it("should return status 200 and { redis: true, db: true }", async () => {
      const res = await request(app).get("/status");
      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal({ redis: true, db: true });
    });
  });
});

describe("GET /stats", () => {
  it("should return status 200 and { users: <number>, files: <number> }", async () => {
    const res = await request(app).get("/stats");
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property("users");
    expect(res.body).to.have.property("files");
  });
});
