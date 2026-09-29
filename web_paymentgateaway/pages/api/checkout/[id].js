import { ObjectId } from "mongodb";
import { getDatabase } from "../../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid checkout ID" });
  }

  try {
    const database = await getDatabase();
    const checkout = await database.collection("checkouts").findOne({
      _id: new ObjectId(id),
    });

    if (!checkout) {
      return res.status(404).json({ error: "Checkout not found" });
    }

    return res.status(200).json({
      checkout: {
        ...checkout,
        _id: checkout._id.toString(),
      },
    });
  } catch (error) {
    console.error("Failed to retrieve checkout:", error);
    return res.status(500).json({ error: "Failed to retrieve checkout" });
  }
}
