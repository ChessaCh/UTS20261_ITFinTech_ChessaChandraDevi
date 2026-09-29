import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";

const CART_KEY = "payment-gateway-cart";

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
  const checkoutStatus = checkout?.status;

  /*
   * Load checkout from MongoDB.
   */
  const loadCheckout = useCallback(async () => {
    if (!checkoutId) return;

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
  }, [checkoutId]);

  /*
   * Initial checkout loading.
   */
  useEffect(() => {
    if (!router.isReady || !checkoutId) return;

    const initialLoad = window.setTimeout(loadCheckout, 0);
    return () => window.clearTimeout(initialLoad);
  }, [checkoutId, loadCheckout, router.isReady]);

  /*
   * Poll checkout status until it becomes PAID.
   *
   * The frontend does NOT change the payment status.
   * It only reads the status from MongoDB.
   */
  useEffect(() => {
    if (!router.isReady || !checkoutId) return;
    if (!checkoutStatus || checkoutStatus === "PAID") return;

    const interval = setInterval(() => {
      loadCheckout();
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [checkoutId, checkoutStatus, loadCheckout, router.isReady]);

  useEffect(() => {
    if (checkoutStatus !== "PAID" || !checkout?.items) return;

    try {
      const cart = JSON.parse(window.localStorage.getItem(CART_KEY)) || [];
      const paidProductIds = new Set(
        checkout.items.map((item) => item.productId)
      );
      const remainingCart = cart.filter(
        (item) => !paidProductIds.has(item.productId)
      );

      window.localStorage.setItem(
        CART_KEY,
        JSON.stringify(remainingCart)
      );
    } catch {
      // Ignore malformed cart data; payment status remains server-controlled.
    }
  }, [checkout, checkoutStatus]);

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

      <main className={`page-container payment-page ${isPaid ? "payment-page-paid" : "payment-page-pending"}`}>
        <div className="checkout-progress" aria-label="Checkout progress"><Link className="progress-step progress-step-done" href="/checkout"><span>01</span><strong>Cart</strong></Link><span className="progress-line progress-line-done" /><div className={`progress-step ${isPaid ? "progress-step-done" : "progress-step-active"}`}><span>02</span><strong>Payment</strong></div><span className={`progress-line ${isPaid ? "progress-line-done" : ""}`} /><div className={`progress-step ${isPaid ? "progress-step-active" : ""}`}><span>03</span><strong>Completed</strong></div></div>
        <div className="page-title payment-page-title">
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
              Back to cart
            </Link>
          </div>
        ) : (
          <div className="payment-layout payment-layout-enhanced">
            <section className="summary-panel order-summary payment-order-panel">
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
                  style={isPaid ? {
                    backgroundColor: "#d9efe2",
                    color: "#1f6b45",
                  } : undefined}
                >
                  {isPaid ? "LUNAS" : "PENDING"}
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

            <aside className="payment-action payment-action-card">
              <p className="eyebrow">
                Payment status
              </p>

              <div className={`payment-status ${isPaid ? "payment-status-paid" : "payment-status-pending"}`}>
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
                  <div className="payment-success-banner">
                    <span className="payment-success-icon" aria-hidden="true">OK</span>
                    <div>
                      <strong>Pembayaran berhasil</strong>
                      <span>Pesanan kamu sudah dikonfirmasi.</span>
                    </div>
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
                    Back to cart
                  </Link>
                </>
              ) : (
                <>
                  <p>
                    Selesaikan pembayaran secara aman untuk
                    mengonfirmasi pesanan.
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
                    Back to cart
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