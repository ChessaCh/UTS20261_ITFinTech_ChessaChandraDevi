import { getDatabase } from "../../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const callbackToken = req.headers["x-callback-token"];

    if (
      !process.env.XENDIT_WEBHOOK_TOKEN ||
      callbackToken !== process.env.XENDIT_WEBHOOK_TOKEN
    ) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const { event, data } = req.body || {};

    if (!event || !data) {
      return res.status(400).json({
        error: "Invalid webhook payload",
      });
    }

    const database = await getDatabase();

    console.log("Xendit webhook received:", event);

    if (event === "payment_session.completed") {
      const {
        payment_session_id,
        payment_request_id,
        payment_id,
        reference_id,
        amount,
      } = data;

      if (!reference_id || !payment_session_id) {
        return res.status(400).json({
          error: "Missing payment session information",
        });
      }

      const checkout = await database.collection("checkouts").findOne({
        referenceId: reference_id,
      });

      if (!checkout) {
        console.error(
          "Checkout not found for referenceId:",
          reference_id
        );

        return res.status(404).json({
          error: "Checkout not found",
        });
      }

      const now = new Date();

      await database.collection("payments").updateOne(
        {
          referenceId: reference_id,
        },
        {
          $set: {
            checkoutId: checkout._id.toString(),
            referenceId: reference_id,
            paymentSessionId: payment_session_id,
            paymentRequestId: payment_request_id || null,
            paymentId: payment_id || null,
            amount: amount || checkout.total,
            currency: "IDR",
            status: "PAID",
            paidAt: now,
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
          },
        },
        {
          upsert: true,
        }
      );

      await database.collection("checkouts").updateOne(
        {
          _id: checkout._id,
          status: { $ne: "PAID" },
        },
        {
          $set: {
            status: "PAID",
            updatedAt: now,
          },
        }
      );

      console.log(
        `Checkout ${reference_id} successfully marked as PAID`
      );

      return res.status(200).json({
        received: true,
        status: "PAID",
      });
    }

    if (event === "payment_session.expired") {
      const { payment_session_id, reference_id } = data;

      if (!reference_id || !payment_session_id) {
        return res.status(400).json({
          error: "Missing payment session information",
        });
      }

      const now = new Date();

      await database.collection("payments").updateOne(
        {
          referenceId: reference_id,
        },
        {
          $set: {
            paymentSessionId: payment_session_id,
            status: "EXPIRED",
            updatedAt: now,
          },
          $setOnInsert: {
            referenceId: reference_id,
            createdAt: now,
          },
        },
        {
          upsert: true,
        }
      );

      await database.collection("checkouts").updateOne(
        {
          referenceId: reference_id,
          status: { $ne: "PAID" },
        },
        {
          $set: {
            status: "PAYMENT_EXPIRED",
            updatedAt: now,
          },
        }
      );

      console.log(
        `Checkout ${reference_id} payment session expired`
      );

      return res.status(200).json({
        received: true,
        status: "EXPIRED",
      });
    }

    return res.status(200).json({
      received: true,
      ignored: true,
    });
  } catch (error) {
    console.error("Xendit webhook processing failed:", error);

    return res.status(500).json({
      error: "Webhook processing failed",
    });
  }
}