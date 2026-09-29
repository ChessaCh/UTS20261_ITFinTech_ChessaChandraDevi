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
  const checkoutId = Array.isArray(router.query.checkoutId) ? router.query.checkoutId[0] : router.query.checkoutId;
  const missingCheckoutId = router.isReady && !checkoutId;
  useEffect(() => {
    if (!router.isReady || !checkoutId) return undefined;

    async function loadCheckout() {
      try {
        const response = await fetch(`/api/checkout/${encodeURIComponent(checkoutId)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load checkout");
        setCheckout(data.checkout);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadCheckout();
  }, [checkoutId, router.isReady]);
  const money = (value) => `Rp ${value.toLocaleString("id-ID")}`;
  const itemCount = checkout?.items?.reduce((total, item) => total + item.quantity, 0) || 0;
  const isPaid = checkout?.status === "PAID";
  const displayError = error || (missingCheckoutId ? "Checkout ID is missing" : "");
  const showLoading = isLoading && !missingCheckoutId;

  return <div className="site-shell"><Navbar cartCount={itemCount} /><main className="page-container payment-page"><div className="page-title"><p className="eyebrow">Final step</p><h1>Payment</h1>{showLoading ? <p className="intro-copy">Loading checkout...</p> : displayError ? <p className="intro-copy">Unable to load your checkout.</p> : <p className="intro-copy">Reference ID: {checkout.referenceId}</p>}</div>{showLoading ? <div className="empty-state large"><h2>Loading checkout...</h2></div> : displayError ? <div className="empty-state large"><h2>Unable to load checkout</h2><p>{displayError}</p><Link className="primary-button" href="/checkout">Back to checkout</Link></div> : <div className="payment-layout"><section className="summary-panel order-summary"><div className="summary-heading"><div><p className="eyebrow">Order summary</p><h2>Selected items</h2></div><span className="status-badge">{checkout.status}</span></div>{checkout.items.map((item) => <div className="order-line" key={item.productId}><span>{item.name} <small>x{item.quantity}</small></span><strong>{money(item.subtotal)}</strong></div>)}<div className="summary-divider" /><div className="summary-row"><span>Subtotal</span><strong>{money(checkout.subtotal)}</strong></div><div className="summary-row"><span>Tax</span><strong>{money(checkout.tax)}</strong></div><div className="summary-total"><span>Total</span><strong>{money(checkout.total)}</strong></div></section><aside className="payment-action"><p className="eyebrow">Payment status</p><div className="payment-status"><span className="status-dot" />{checkout.status}</div><p>This demo does not contact a payment gateway yet.</p><button className="primary-button full-width" disabled={isPaid} onClick={() => setMessage("Payment gateway will be integrated in the next phase.")}>Confirm &amp; Pay</button>{message && <p className="notice" role="status">{message}</p>}<Link className="back-link" href="/checkout">Back to checkout</Link></aside></div>}</main></div>;
}