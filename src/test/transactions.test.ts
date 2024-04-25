import { afterAll, beforeAll, describe, expect, it, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app";

import { execSync } from "node:child_process";

describe("Transaction routes", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    execSync("npm run knex -- migrate:rollback --all");
    execSync("npm run knex -- migrate:latest");
  });

  it("should be able to create a new transaction", async () => {
    await request(app.server)
      .post("/transactions")
      .send({
        title: "New transaction",
        amount: 5500,
        type: "credit",
      })
      .expect(201);
  });

  it("should be able to list all transactions", async () => {
    const createTransactionReturn = await request(app.server)
      .post("/transactions")
      .send({
        title: "New transaction",
        amount: 5500,
        type: "credit",
      })
      .expect(201);

    const cookies = createTransactionReturn.headers["set-cookie"];

    const response = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies)
      .expect(200);

    expect(response.body.transactions).toEqual([
      expect.objectContaining({
        // um objeto contendo esses valores passados
        title: "New transaction",
        amount: 5500,
      }),
    ]);
  });

  it("should be able to get transaction by id", async () => {
    const createTransactionReturn = await request(app.server)
      .post("/transactions")
      .send({
        title: "New transaction",
        amount: 5500,
        type: "credit",
      })
      .expect(201);

    const cookies = createTransactionReturn.headers["set-cookie"];

    const allTransactions = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies)
      .expect(200);

    const id = allTransactions.body.transactions[0].id;

    const response = await request(app.server)
      .get(`/transactions/${id}`)
      .set("Cookie", cookies)
      .expect(200);

    expect(response.body.transaction).toEqual(
      expect.objectContaining({
        title: "New transaction",
        amount: 5500,
      })
    );
  });

  it("should be able to get summary of transactions", async () => {
    const createTransactionReturn = await request(app.server)
      .post("/transactions")
      .send({
        title: "Credit transaction",
        amount: 5500,
        type: "credit",
      })
      .expect(201);

    const cookies = createTransactionReturn.headers["set-cookie"];

    await request(app.server)
      .post("/transactions")
      .set("Cookie", cookies)
      .send({
        title: "Debit transaction",
        amount: 500,
        type: "debit",
      })
      .expect(201);

    const response = await request(app.server)
      .get(`/transactions/summary`)
      .set("Cookie", cookies)
      .expect(200);

    console.log(response.body);

    expect(response.body.summary).toEqual({
      amount: 5000,
    });
  });
});
