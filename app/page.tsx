import { db } from "@/db/drizzle";

async function getData() {
  const response = await db.execute(`SELECT version()`);
  return response;
}
export default async function Home() {
  const data = await getData();
  console.log("Database version:", data);
  return <>asdf</>;
}
