import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";

const CART_KEY = "payment-gateway-cart";
const categories = ["All", "Drinks", "Snacks", "Food", "Dessert"];

function readCart() {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(CART_KEY)) || []; } catch { return []; }
}

export default function Home() {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [notification, setNotification] = useState("");
  const [retryToken, setRetryToken] = useState(0);
  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/api/products");
        if (!response.ok) throw new Error("Unable to load products");
        const data = await response.json();
        setProducts((data.products || []).map((product) => ({
          ...product,
          icon: product.icon || product.name,
        })));
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadProducts();
  }, [retryToken]);
  useEffect(() => {
    const timer = window.setTimeout(() => setCart(readCart()), 0);
    return () => window.clearTimeout(timer);
  }, []);
  function addToCart(product) {
    const nextCart = [...cart];
    const existingItem = nextCart.find((item) => item.productId === product.id);
    if (existingItem) existingItem.quantity += 1;
    else nextCart.push({ productId: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl, quantity: 1 });
    setCart(nextCart);
    window.localStorage.setItem(CART_KEY, JSON.stringify(nextCart));
    setNotification(`${product.name} was added to your cart.`);
    window.setTimeout(() => setNotification(""), 2500);
  }

  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (category === "All" || product.category === category);
  }), [category, products, search]);
  const cartQuantity = cart.reduce((total, item) => total + item.quantity, 0);

  return <div className="site-shell"><Navbar cartCount={cartQuantity} /><main className="page-container">
    <section className="intro-section"><div className="intro-content"><p className="eyebrow">Fresh picks, made for you</p><h1>Find something you&apos;ll love.</h1><p className="intro-copy">Browse food, drinks, snacks, and desserts, then build your order in a few clicks.</p></div><Link className="outline-button" href="/checkout">View cart <span aria-hidden="true">-&gt;</span></Link></section>{notification && <div className="cart-notification" role="status">{notification}</div>}
    <section className="catalog-controls" aria-label="Product filters"><label className="search-box"><span className="search-icon" aria-hidden="true">Search</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products..." aria-label="Search products" /></label><div className="category-list" role="group" aria-label="Product categories">{categories.map((item) => <button type="button" className={category === item ? "category-button active" : "category-button"} key={item} onClick={() => setCategory(item)} aria-pressed={category === item}>{item}</button>)}</div></section>
    <div className="section-heading"><div><p className="eyebrow">Explore our menu</p><h2>{category === "All" ? "All products" : category}</h2></div><span className="result-count">{visibleProducts.length} {visibleProducts.length === 1 ? "product" : "products"}</span></div>
    {isLoading ? <section className="product-grid" aria-label="Loading products">{Array.from({ length: 8 }, (_, index) => <div className="product-card product-card-skeleton" key={index}><div className="skeleton-image" /><div className="product-card-body"><div className="skeleton-line skeleton-category" /><div className="skeleton-line skeleton-title" /><div className="skeleton-line skeleton-description" /><div className="skeleton-footer"><div className="skeleton-line skeleton-price" /><div className="skeleton-button" /></div></div></div>)}</section> : error ? <div className="empty-state"><div className="empty-state-mark" aria-hidden="true">!</div><h2>Unable to load products</h2><p>{error}</p><button type="button" className="primary-button" onClick={() => { setError(""); setIsLoading(true); setRetryToken((value) => value + 1); }}>Try again</button></div> : visibleProducts.length > 0 ? <section className="product-grid">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} />)}</section> : <div className="empty-state"><div className="empty-state-mark" aria-hidden="true">-</div><h2>No products found</h2><p>Try another search or choose a different category.</p><button type="button" className="outline-button" onClick={() => { setSearch(""); setCategory("All"); }}>Clear filters</button></div>}
  </main></div>;
}