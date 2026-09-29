import Link from "next/link";

export default function Navbar({ cartCount = 0 }) {
  return <header className="site-header"><div className="header-inner"><Link className="brand" href="/">NOURISH<span>.</span></Link><Link className="cart-link" href="/checkout" aria-label={`Cart with ${cartCount} items`}><span className="cart-icon" aria-hidden="true">Cart</span><span className="cart-count">{cartCount}</span></Link></div></header>;
}