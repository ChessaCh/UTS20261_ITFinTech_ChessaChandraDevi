import { ObjectId } from "mongodb";
import { getDatabase } from "../../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secretKey = process.env.XENDIT_SECRET_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "");

  if (!secretKey || !baseUrl) {
    return res.status(500).json({ error: "Payment configuration is incomplete" });
  }

  try {
    const { checkoutId } = req.body || {};
    if (!checkoutId || !ObjectId.isValid(checkoutId)) {
      return res.status(400).json({ error: "A valid checkoutId is required" });
    }

    const database = await getDatabase();
    const checkout = await database.collection("checkouts").findOne({
      _id: new ObjectId(checkoutId),
    });

    if (!checkout) {
      return res.status(404).json({ error: "Checkout not found" });
    }

    if (checkout.status === "PAID") {
      return res.status(409).json({ error: "Checkout is already paid" });
    }

    if (!Number.isFinite(checkout.total) || checkout.total <= 0) {
      return res.status(400).json({ error: "Checkout total must be greater than zero" });
    }

    const sessionPayload = {
      reference_id: checkout.referenceId,
      session_type: "PAY",
      mode: "PAYMENT_LINK",
      currency: "IDR",
      country: "ID",
      amount: checkout.total,
      capture_method: "AUTOMATIC",
      description: `Payment for ${checkout.referenceId}`,
      metadata: { checkoutId: checkout._id.toString() },
      items: checkout.items.map((item) => ({
        reference_id: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      success_return_url: `${baseUrl.replace(/\/$/, "")}/payment?checkoutId=${checkout._id}`,
      cancel_return_url: `${baseUrl.replace(/\/$/, "")}/payment?checkoutId=${checkout._id}`,
    };

    const authorization = Buffer.from(`${secretKey}:`).toString("base64");
    const xenditResponse = await fetch("https://api.xendit.co/sessions", {
      method: "POST",
      headers: {
        Authorization: `Basic ${authorization}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sessionPayload),
    });
    const xenditSession = await xenditResponse.json().catch(() => null);

    if (!xenditResponse.ok) {
      console.error("Xendit session creation failed with status:", xenditResponse.status);
      return res.status(502).json({ error: "Unable to create payment session" });
    }

    const paymentSessionId = xenditSession?.payment_session_id || xenditSession?.session_id;
    if (!paymentSessionId || !xenditSession.payment_link_url) {
      console.error("Xendit response did not contain a payment session link");
      return res.status(502).json({ error: "Invalid payment session response" });
    }

    await database.collection("payments").insertOne({
      checkoutId: checkout._id.toString(),
      paymentSessionId,
      paymentLinkUrl: xenditSession.payment_link_url,
      referenceId: xenditSession.reference_id || checkout.referenceId,
      amount: xenditSession.amount,
      status: "PENDING",
      xenditStatus: xenditSession.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return res.status(200).json({
      payment_link_url: xenditSession.payment_link_url,
    });
  } catch (error) {
    console.error("Failed to create Xendit payment session:", error);
    return res.status(500).json({ error: "Failed to create payment session" });
  }
}
