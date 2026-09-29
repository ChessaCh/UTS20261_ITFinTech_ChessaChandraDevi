import { getDatabase } from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const database = await getDatabase();
    await database.command({ ping: 1 });

    return res.status(200).json({
      success: true,
      message: "Database connection successful",
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    return res.status(500).json({
      success: false,
      error: "Database connection failed",
    });
  }
}
