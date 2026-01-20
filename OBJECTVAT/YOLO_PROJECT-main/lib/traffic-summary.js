// traffic-summary.js
import { pool } from "./db.js";
import { getObjectInfo } from "./getObjectInfo.js";
import { cache } from "./cache.js";

const SUMMARY_CACHE_KEY = "traffic_summary";

export async function getTrafficSummary() {
  const cached = cache.get(SUMMARY_CACHE_KEY);
  if (cached) return cached;

  const [allObjects, dbResult] = await Promise.all([
    getObjectInfo(),
    pool.query(`
      SELECT class_name, COUNT(*) AS count
      FROM "dbo"."logs"
      GROUP BY class_name
      ORDER BY count DESC;
    `),
  ]);

  const dbMap = new Map(
    dbResult.rows.map((row) => [row.class_name, parseInt(row.count)])
  );

  const finalSummary = allObjects.map((obj) => ({
    class_name: obj.class_name,
    image: obj.image || "",
    count: dbMap.get(obj.class_name) || 0,
  }));

  cache.set(SUMMARY_CACHE_KEY, finalSummary);
  return finalSummary;
}
