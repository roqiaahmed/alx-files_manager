import { describe, it } from "mocha";
import { expect } from "chai";
import request from "supertest";

describe("AuthController", () => {
  describe("GET /connect", () => {
    it("should return status 200 and a token if credentials are valid", async () => {
      const res = await request(app)
        .get("/connect")
        .set("Authorization", "Basic base64encodedcredentials"); // Replace base64encodedcredentials with actual base64 encoded credentials
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("token");
    });
  });
});
