import { ObjectId } from "mongodb";
import { getDatabase } from "../../../lib/mongodb";

const TAX_RATE = 0.11;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { items } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cart items are required" });
    }

    const selectedItems = items.map((item) => {
      if (!item || !ObjectId.isValid(item.productId) || !Number.isInteger(item.quantity) || item.quantity < 1) {
        throw new Error("Each item must have a valid productId and quantity");
      }

      return {
        productId: new ObjectId(item.productId),
        quantity: item.quantity,
      };
    });

    const database = await getDatabase();
    const productIds = selectedItems.map((item) => item.productId);
    const products = await database.collection("products").find({
      _id: { $in: productIds },
      isActive: true,
    }).toArray();
    const productsById = new Map(products.map((product) => [product._id.toString(), product]));

    const checkoutItems = selectedItems.map(({ productId, quantity }) => {
      const product = productsById.get(productId.toString());
      if (!product) {
        throw new Error("One or more products were not found");
      }

      const itemSubtotal = product.price * quantity;
      return {
        productId: product._id.toString(),
        name: product.name,
        price: product.price,
        quantity,
        subtotal: itemSubtotal,
      };
    });

    const subtotal = checkoutItems.reduce((total, item) => total + item.subtotal, 0);
    const tax = Math.round(subtotal * TAX_RATE);
    const total = subtotal + tax;
    const now = new Date();
    const referenceId = `ORDER-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const checkout = {
      referenceId,
      items: checkoutItems,
      subtotal,
      tax,
      total,
      status: "PENDING_PAYMENT",
      createdAt: now,
      updatedAt: now,
    };

    const result = await database.collection("checkouts").insertOne(checkout);

    return res.status(201).json({
      checkoutId: result.insertedId.toString(),
      referenceId,
    });
  } catch (error) {
    if (error.message === "Each item must have a valid productId and quantity" || error.message === "One or more products were not found") {
      return res.status(400).json({ error: error.message });
    }

    console.error("Failed to create checkout:", error);
    return res.status(500).json({ error: "Failed to create checkout" });
  }
}
