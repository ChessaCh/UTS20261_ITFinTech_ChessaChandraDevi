import { getDatabase } from "../../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const database = await getDatabase();
    const products = await database
      .collection("products")
      .find({ isActive: true })
      .sort({ name: 1 })
      .toArray();

    const responseProducts = products.map(({ _id, ...product }) => ({
      id: _id.toString(),
      ...product,
    }));

    return res.status(200).json({ products: responseProducts });
  } catch (error) {
    console.error("Failed to retrieve products:", error);
    return res.status(500).json({ error: "Failed to retrieve products" });
  }
}
