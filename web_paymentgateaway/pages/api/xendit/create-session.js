import { ObjectId } from "mongodb";
import { getDatabase } from "../../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { checkoutId } = req.body || {};

    if (!checkoutId || !ObjectId.isValid(checkoutId)) {
      return res.status(400).json({
        error: "Valid checkoutId is required",
      });
    }

    const database = await getDatabase();

    const checkout = await database.collection("checkouts").findOne({
      _id: new ObjectId(checkoutId),
    });

    if (!checkout) {
      return res.status(404).json({
        error: "Checkout not found",
      });
    }

    if (checkout.status === "PAID") {
      return res.status(400).json({
        error: "Checkout has already been paid",
      });
    }

    if (!checkout.total || checkout.total <= 0) {
      return res.status(400).json({
        error: "Invalid checkout total",
      });
    }

    if (!process.env.XENDIT_SECRET_KEY) {
      throw new Error("XENDIT_SECRET_KEY is not configured");
    }

    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      throw new Error("NEXT_PUBLIC_BASE_URL is not configured");
    }

    const xenditResponse = await fetch("https://api.xendit.co/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic " +
          Buffer.from(`${process.env.XENDIT_SECRET_KEY}:`).toString("base64"),
      },
      body: JSON.stringify({
        reference_id: checkout.referenceId,
        session_type: "PAY",
        mode: "PAYMENT_LINK",
        amount: checkout.total,
        currency: "IDR",
        country: "ID",
        capture_method: "AUTOMATIC",
        description: `Payment for ${checkout.referenceId}`,

        items: checkout.items.map((item) => ({
          reference_id: item.productId,
          name: item.name,
          description: item.name,
          type: "PHYSICAL_PRODUCT",
          category: "PRODUCT",
          net_unit_amount: item.price,
          quantity: item.quantity,
          currency: "IDR",
        })),

        success_return_url:
          `${process.env.NEXT_PUBLIC_BASE_URL}/payment?checkoutId=${checkout._id.toString()}&payment=success`,

        cancel_return_url:
          `${process.env.NEXT_PUBLIC_BASE_URL}/payment?checkoutId=${checkout._id.toString()}&payment=cancelled`,

        metadata: {
          checkoutId: checkout._id.toString(),
        },
      }),
    });

    const data = await xenditResponse.json();

    if (!xenditResponse.ok) {
      console.error("Xendit API error:", data);

      return res.status(xenditResponse.status).json({
        error: "Failed to create Xendit payment session",
        details: data,
      });
    }

    await database.collection("payments").updateOne(
      {
        checkoutId: checkout._id.toString(),
      },
      {
        $set: {
          checkoutId: checkout._id.toString(),
          referenceId: checkout.referenceId,
          paymentSessionId: data.payment_session_id,
          paymentRequestId: data.payment_request_id || null,
          paymentId: data.payment_id || null,
          amount: checkout.total,
          currency: "IDR",
          status: "PENDING",
          paymentLinkUrl: data.payment_link_url,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      {
        upsert: true,
      }
    );

    return res.status(200).json({
      paymentSessionId: data.payment_session_id,
      paymentLinkUrl: data.payment_link_url,
      referenceId: data.reference_id,
    });
  } catch (error) {
    console.error("Failed to create Xendit session:", error);

    return res.status(500).json({
      error: "Failed to create payment session",
    });
  }
}