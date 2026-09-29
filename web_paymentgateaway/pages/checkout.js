import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import CartItem from "../components/CartItem";

export const CART_KEY = "payment-gateway-cart";
export const TAX_RATE = 0.11;
function loadCart() { if (typeof window === "undefined") return []; try { return JSON.parse(window.localStorage.getItem(CART_KEY)) || []; } catch { return []; } }

export default function Checkout() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => setCart(loadCart()), 0);
    return () => window.clearTimeout(timer);
  }, []);
  function updateCart(nextCart) { setCart(nextCart); window.localStorage.setItem(CART_KEY, JSON.stringify(nextCart)); }
  function changeQuantity(productId, amount) { updateCart(cart.map((item) => item.productId === productId ? { ...item, quantity: item.quantity + amount } : item).filter((item) => item.quantity > 0)); }
  function removeItem(productId) { updateCart(cart.filter((item) => item.productId !== productId)); }
  async function createCheckout() {
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(({ productId, quantity }) => ({ productId, quantity })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create checkout");
      router.push(`/payment?checkoutId=${encodeURIComponent(data.checkoutId)}`);
    } catch (submitError) {
      setError(submitError.message);
      setIsSubmitting(false);
    }
  }
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax;
  const money = (value) => `Rp ${value.toLocaleString("id-ID")}`;
  return <div className="site-shell"><Navbar cartCount={cart.reduce((totalQuantity, item) => totalQuantity + item.quantity, 0)} /><main className="page-container checkout-page"><div className="checkout-progress" aria-label="Checkout progress"><div className="progress-step progress-step-active"><span>01</span><strong>Cart</strong></div><span className="progress-line" /><div className="progress-step"><span>02</span><strong>Payment</strong></div><span className="progress-line" /><div className="progress-step"><span>03</span><strong>Completed</strong></div></div><div className="page-title"><p className="eyebrow">Your order</p><h1>Review your cart.</h1><p className="intro-copy">Check your items before continuing to payment.</p></div>{cart.length === 0 ? <div className="empty-state large"><h2>Your cart is empty</h2><p>Add a product from the menu to get started.</p><Link className="primary-button" href="/">Back to select items</Link></div> : <div className="checkout-layout"><section className="cart-list">{cart.map((item) => <CartItem key={item.productId} item={item} onIncrease={(id) => changeQuantity(id, 1)} onDecrease={(id) => changeQuantity(id, -1)} onRemove={removeItem} />)}</section><aside className="summary-panel"><p className="eyebrow">Summary</p><div className="summary-row"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div className="summary-row"><span>Tax (11%)</span><strong>{money(tax)}</strong></div><div className="summary-total"><span>Total</span><strong>{money(total)}</strong></div>{error && <p className="notice" role="alert">{error}</p>}<button className="primary-button full-width" onClick={createCheckout} disabled={isSubmitting}>{isSubmitting ? "Creating checkout..." : "Continue to Payment"}</button></aside></div>}</main></div>;
}