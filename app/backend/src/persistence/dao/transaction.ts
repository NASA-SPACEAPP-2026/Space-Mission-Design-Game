import type { SqlConnection, SqlPool } from "./types.js";

export async function withTransaction<T>(
  pool: SqlPool,
  operation: (connection: SqlConnection) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();
  let committed = false;
  try {
    await connection.beginTransaction();
    const result = await operation(connection);
    await connection.commit();
    committed = true;
    return result;
  } catch (error) {
    if (!committed) {
      try {
        await connection.rollback();
      } catch {
        // Preserve the application/database error that caused rollback.
      }
    }
    throw error;
  } finally {
    connection.release();
  }
}
