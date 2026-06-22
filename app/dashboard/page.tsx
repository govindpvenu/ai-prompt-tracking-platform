import { db } from "@/db/drizzle";

async function getData() {
  const response = await db.execute(`SELECT version()`);
  return response;
}

export default async function Dashboard() {
  const data = await getData();
  console.log("Database version:", data);
  return <>This is the dashboard ,{data.rows[0].version}</>;
}
