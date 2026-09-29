export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      message: "Method Not Allowed",
    });
  }

  console.log("Xendit webhook received:", req.body);

  return res.status(200).json({
    received: true,
  });
}