import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { CART_KEY, TAX_RATE } from "./checkout";

function loadCart() { if (typeof window === "undefined") return []; try { return JSON.parse(window.localStorage.getItem(CART_KEY)) || []; } catch { return []; } }

export default function Payment() {
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => setCart(loadCart()), 0);
    return () => window.clearTimeout(timer);
  }, []);
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const money = (value) => `Rp ${value.toLocaleString("id-ID")}`;
  return <div className="site-shell"><Navbar cartCount={cart.reduce((totalQuantity, item) => totalQuantity + item.quantity, 0)} /><main className="page-container payment-page"><div className="page-title"><p className="eyebrow">Final step</p><h1>Payment</h1><p className="intro-copy">Your order is ready for the next payment phase.</p></div><div className="payment-layout"><section className="summary-panel order-summary"><div className="summary-heading"><div><p className="eyebrow">Order summary</p><h2>Selected items</h2></div><span className="status-badge">UNPAID</span></div>{cart.length === 0 ? <p className="muted-copy">No items in this order.</p> : cart.map((item) => <div className="order-line" key={item.productId}><span>{item.name} <small>x{item.quantity}</small></span><strong>{money(item.price * item.quantity)}</strong></div>)}<div className="summary-divider" /><div className="summary-row"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div className="summary-row"><span>Tax (11%)</span><strong>{money(tax)}</strong></div><div className="summary-total"><span>Total</span><strong>{money(subtotal + tax)}</strong></div></section><aside className="payment-action"><p className="eyebrow">Payment status</p><div className="payment-status"><span className="status-dot" />UNPAID</div><p>This demo does not contact a payment gateway yet.</p><button className="primary-button full-width" onClick={() => setMessage("Payment gateway will be integrated in the next phase.")}>Confirm &amp; Pay</button>{message && <p className="notice" role="status">{message}</p>}<Link className="back-link" href="/checkout">Back to checkout</Link></aside></div></main></div>;
}