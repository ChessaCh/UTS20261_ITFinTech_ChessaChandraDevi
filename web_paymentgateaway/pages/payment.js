import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";

export default function Payment() {
  const router = useRouter();

  const [checkout, setCheckout] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  const checkoutId = Array.isArray(router.query.checkoutId)
    ? router.query.checkoutId[0]
    : router.query.checkoutId;

  const missingCheckoutId = router.isReady && !checkoutId;

  /*
   * Load checkout from MongoDB.
   */
  async function loadCheckout(showLoading = false) {
    if (!checkoutId) return;

    if (showLoading) {
      setIsLoading(true);
    }

    try {
      const response = await fetch(
        `/api/checkout/${encodeURIComponent(checkoutId)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load checkout");
      }

      setCheckout(data.checkout);
      setError("");
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  /*
   * Initial checkout loading.
   */
  useEffect(() => {
    if (!router.isReady || !checkoutId) return;

    loadCheckout(true);
  }, [checkoutId, router.isReady]);

  /*
   * Poll checkout status until it becomes PAID.
   *
   * The frontend does NOT change the payment status.
   * It only reads the status from MongoDB.
   */
  useEffect(() => {
    if (!router.isReady || !checkoutId) return;
    if (!checkout) return;
    if (checkout.status === "PAID") return;

    const interval = setInterval(() => {
      loadCheckout(false);
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [router.isReady, checkoutId, checkout?.status]);

  /*
   * Create Xendit Payment Session.
   */
  async function createPaymentSession() {
    setIsPaying(true);
    setMessage("");

    try {
      const response = await fetch("/api/xendit/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          checkoutId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to start payment"
        );
      }

      if (!data.paymentLinkUrl) {
        throw new Error(
          "Payment link was not returned by Xendit"
        );
      }

      /*
       * Redirect customer to Xendit Hosted Checkout.
       */
      window.location.href = data.paymentLinkUrl;
    } catch (paymentError) {
      setMessage(paymentError.message);
      setIsPaying(false);
    }
  }

  const money = (value) =>
    `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

  const itemCount =
    checkout?.items?.reduce(
      (total, item) => total + item.quantity,
      0
    ) || 0;

  const isPaid = checkout?.status === "PAID";

  const displayError =
    error ||
    (missingCheckoutId ? "Checkout ID is missing" : "");

  const showLoading = isLoading && !missingCheckoutId;

  return (
    <div className="site-shell">
      <Navbar cartCount={itemCount} />

      <main className="page-container payment-page">
        <div className="page-title">
          <p className="eyebrow">Final step</p>

          <h1>Payment</h1>

          {showLoading ? (
            <p className="intro-copy">
              Loading checkout...
            </p>
          ) : displayError ? (
            <p className="intro-copy">
              Unable to load your checkout.
            </p>
          ) : (
            <p className="intro-copy">
              Reference ID: {checkout.referenceId}
            </p>
          )}
        </div>

        {showLoading ? (
          <div className="empty-state large">
            <h2>Loading checkout...</h2>
          </div>
        ) : displayError ? (
          <div className="empty-state large">
            <h2>Unable to load checkout</h2>

            <p>{displayError}</p>

            <Link
              className="primary-button"
              href="/checkout"
            >
              Back to checkout
            </Link>
          </div>
        ) : (
          <div className="payment-layout">
            <section className="summary-panel order-summary">
              <div className="summary-heading">
                <div>
                  <p className="eyebrow">
                    Order summary
                  </p>

                  <h2>Selected items</h2>
                </div>

                <span
                  className={`status-badge ${
                    isPaid ? "paid" : ""
                  }`}
                >
                  {isPaid ? "LUNAS" : checkout.status}
                </span>
              </div>

              {checkout.items.map((item) => (
                <div
                  className="order-line"
                  key={item.productId}
                >
                  <span>
                    {item.name}{" "}
                    <small>x{item.quantity}</small>
                  </span>

                  <strong>
                    {money(item.subtotal)}
                  </strong>
                </div>
              ))}

              <div className="summary-divider" />

              <div className="summary-row">
                <span>Subtotal</span>

                <strong>
                  {money(checkout.subtotal)}
                </strong>
              </div>

              <div className="summary-row">
                <span>Tax</span>

                <strong>
                  {money(checkout.tax)}
                </strong>
              </div>

              <div className="summary-total">
                <span>Total</span>

                <strong>
                  {money(checkout.total)}
                </strong>
              </div>
            </section>

            <aside className="payment-action">
              <p className="eyebrow">
                Payment status
              </p>

              <div className="payment-status">
                <span className="status-dot" />

                {isPaid
                  ? "LUNAS"
                  : checkout.status ===
                    "PAYMENT_EXPIRED"
                  ? "Payment Expired"
                  : "Menunggu Pembayaran"}
              </div>

              {isPaid ? (
                <>
                  <p>
                    Your payment has been successfully
                    received.
                  </p>

                  <div className="notice">
                    Payment completed successfully.
                  </div>
                </>
              ) : checkout.status ===
                "PAYMENT_EXPIRED" ? (
                <>
                  <p>
                    Your payment session has expired.
                    Please create a new checkout.
                  </p>

                  <Link
                    className="primary-button full-width"
                    href="/checkout"
                  >
                    Back to Checkout
                  </Link>
                </>
              ) : (
                <>
                  <p>
                    Continue to the secure payment page
                    to complete your order.
                  </p>

                  <button
                    className="primary-button full-width"
                    disabled={isPaying}
                    onClick={createPaymentSession}
                  >
                    {isPaying
                      ? "Opening Payment..."
                      : "Confirm & Pay"}
                  </button>

                  {message && (
                    <p
                      className="notice"
                      role="alert"
                    >
                      {message}
                    </p>
                  )}

                  <Link
                    className="back-link"
                    href="/checkout"
                  >
                    Back to checkout
                  </Link>
                </>
              )}
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}