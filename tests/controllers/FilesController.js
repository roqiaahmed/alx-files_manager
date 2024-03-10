import { describe, it } from "mocha";
import { expect } from "chai";
import request from "supertest";

describe("FilesController", () => {
  describe("POST /files", () => {
    it("should create a new file and return status 201", async () => {
      const res = await request(app)
        .post("/files")
        .set("x-token", "valid-token")
        .send({
          name: "test_file",
          type: "file",
          data: "base64data",
          parentId: "valid-parent-id",
          isPublic: true,
        });
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property("id");
    });
  });
});
