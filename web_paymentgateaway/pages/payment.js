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

  const isExpired = checkout?.status === "PAYMENT_EXPIRED";
  const statusLabel = isPaid
    ? "Payment Successful"
    : isExpired
      ? "Payment Expired"
      : "Waiting for Payment";

  return (
    <div className="site-shell">
      <Navbar cartCount={itemCount} />
      <main className={`page-container payment-page payment-page-${isPaid ? "success" : isExpired ? "expired" : "pending"}`}>
        <div className="checkout-progress" aria-label="Checkout progress">
          <Link className="progress-step progress-step-done" href="/checkout"><span>01</span><strong>Cart</strong></Link>
          <span className="progress-line progress-line-done" />
          <div className={`progress-step ${isPaid ? "progress-step-done" : "progress-step-active"}`}><span>02</span><strong>Payment</strong></div>
          <span className={`progress-line ${isPaid ? "progress-line-done" : ""}`} />
          <div className={`progress-step ${isPaid ? "progress-step-active" : ""}`}><span>03</span><strong>Completed</strong></div>
        </div>

        <header className="payment-page-title">
          <p className="eyebrow">Final step</p>
          <h1>Payment</h1>
          {showLoading ? <p className="intro-copy">Loading your checkout...</p> : displayError ? <p className="intro-copy">We could not retrieve your payment details.</p> : <div className="payment-reference"><span>Reference ID</span><strong>{checkout.referenceId}</strong></div>}
        </header>

        {showLoading ? (
          <div className="payment-feedback payment-loading-state"><span className="payment-loading-mark" aria-hidden="true" /><h2>Preparing your payment</h2><p>Retrieving your order details securely.</p></div>
        ) : displayError ? (
          <div className="payment-feedback payment-error-state"><span className="payment-feedback-mark" aria-hidden="true">!</span><h2>Unable to Load Payment</h2><p>We could not retrieve your checkout information. Please try again or return to checkout.</p><p className="payment-error-detail" role="alert">{displayError}</p><Link className="primary-button" href="/checkout">Back to Checkout</Link></div>
        ) : (
          <div className="payment-layout payment-layout-enhanced">
            <section className="summary-panel order-summary payment-order-panel">
              <div className="payment-section-heading"><div><p className="eyebrow">Order summary</p><h2>Your order</h2></div><span className={`payment-raw-status payment-raw-status-${checkout.status.toLowerCase()}`}>{checkout.status}</span></div>
              <div className="payment-order-items">{checkout.items.map((item) => <div className="payment-order-line" key={item.productId}><div><strong>{item.name}</strong><span>Quantity {item.quantity}</span></div><strong>{money(item.subtotal)}</strong></div>)}</div>
              <div className="payment-totals"><div className="summary-row"><span>Subtotal</span><strong>{money(checkout.subtotal)}</strong></div><div className="summary-row"><span>Tax</span><strong>{money(checkout.tax)}</strong></div><div className="summary-total"><span>{isPaid ? "Total Paid" : "Total"}</span><strong>{money(checkout.total)}</strong></div></div>
            </section>

            <aside className="payment-action payment-action-card">
              <p className="eyebrow">Payment status</p>
              <div className={`payment-status payment-status-${isPaid ? "paid" : isExpired ? "expired" : "pending"}`}><span className="status-dot" /><span>{statusLabel}</span></div>

              {isPaid ? (
                <div className="payment-success-content"><div className="payment-success-icon" aria-hidden="true">OK</div><h2>Payment Successful</h2><p>Your payment has been received and your order is confirmed.</p><div className="payment-success-details"><div><span>Reference ID</span><strong>{checkout.referenceId}</strong></div><div><span>Total Paid</span><strong>{money(checkout.total)}</strong></div><div><span>Status</span><strong>LUNAS</strong></div></div><Link className="primary-button full-width" href="/">Continue Shopping</Link><Link className="back-link" href="/checkout">Back to cart</Link></div>
              ) : isExpired ? (
                <div className="payment-expired-content"><h2>Payment Session Expired</h2><p>This payment session has expired. Please return to checkout and start a new payment.</p><Link className="primary-button full-width" href="/checkout">Back to Checkout</Link></div>
              ) : (
                <div className="payment-pending-content"><h2>Ready to complete your order?</h2><p>You will be redirected to Xendit&apos;s secure payment page to complete your transaction.</p><button className="primary-button full-width payment-cta" disabled={isPaying} onClick={createPaymentSession}>{isPaying ? "Preparing payment..." : "Confirm & Pay"}</button>{message && <p className="notice" role="alert">{message}</p>}<Link className="back-link" href="/checkout">Back to cart</Link></div>
              )}
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}