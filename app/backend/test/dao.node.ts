import assert from "node:assert/strict";
import test from "node:test";
import { MySqlMissionDao, MySqlUserAccountDao } from "../src/persistence/dao/mysql-adapters.js";
import type { SqlExecutor } from "../src/persistence/dao/types.js";

class RecordingExecutor implements SqlExecutor {
  lastSql = "";
  lastParameters: readonly unknown[] = [];
  result: unknown = [];

  async execute(sql: string, parameters: readonly unknown[] = []): Promise<readonly [unknown, unknown]> {
    this.lastSql = sql;
    this.lastParameters = parameters;
    return [this.result, []];
  }
}

test("user account DAO binds email input as a SQL parameter", async () => {
  const db = new RecordingExecutor();
  db.result = [];
  const dao = new MySqlUserAccountDao(db);

  assert.equal(await dao.findByNormalizedEmail("x' OR 1=1 --"), null);
  assert.match(db.lastSql, /email_normalized = \?/);
  assert.deepEqual(db.lastParameters, ["x' OR 1=1 --"]);
});

test("mission owner lookup scopes through the owning agency", async () => {
  const db = new RecordingExecutor();
  const dao = new MySqlMissionDao(db);

  await dao.findByIdForOwner("11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222");
  assert.match(db.lastSql, /INNER JOIN agencies AS a/);
  assert.match(db.lastSql, /a\.owner_user_id = \?/);
  assert.equal(db.lastParameters.length, 2);
  assert.equal((db.lastParameters[0] as Uint8Array).byteLength, 16);
});
