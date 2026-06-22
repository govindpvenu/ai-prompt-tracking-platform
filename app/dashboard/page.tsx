import { db } from "@/db/drizzle";
import { requireAuth } from "@/helper/require-auth";

async function getData() {
  const response = await db.execute(`SELECT version()`);
  return response;
}

export default async function Dashboard() {
  await requireAuth();
  const data = await getData();
  console.log("Database version:", data);
  return <>This is the dashboard ,{data.rows[0].version}</>;
}
