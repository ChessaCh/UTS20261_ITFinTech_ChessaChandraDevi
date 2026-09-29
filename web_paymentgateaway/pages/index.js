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
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => setCart(readCart()), 0);
    return () => window.clearTimeout(timer);
  }, []);
  function addToCart(product) {
    const nextCart = [...cart];
    const existingItem = nextCart.find((item) => item.productId === product.id);
    if (existingItem) existingItem.quantity += 1;
    else nextCart.push({ productId: product.id, name: product.name, price: product.price, quantity: 1 });
    setCart(nextCart);
    window.localStorage.setItem(CART_KEY, JSON.stringify(nextCart));
    setNotification(`${product.name} berhasil ditambahkan ke cart.`);
    window.setTimeout(() => setNotification(""), 2500);
  }

  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (category === "All" || product.category === category);
  }), [category, products, search]);
  const cartQuantity = cart.reduce((total, item) => total + item.quantity, 0);

  return <div className="site-shell"><Navbar cartCount={cartQuantity} /><main className="page-container">
    <section className="intro-section"><div><p className="eyebrow">Fresh picks, simple checkout</p><h1>Choose something good.</h1><p className="intro-copy">Browse the menu and build your order in a few clicks.</p></div><Link className="outline-button" href="/checkout">View cart <span aria-hidden="true">-&gt;</span></Link></section>{notification && <div className="cart-notification" role="status">{notification}</div>}
    <section className="catalog-controls" aria-label="Product filters"><label className="search-box"><span aria-hidden="true">Search</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" aria-label="Search products" /></label><div className="category-list">{categories.map((item) => <button className={category === item ? "category-button active" : "category-button"} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div></section>
    <div className="section-heading"><div><p className="eyebrow">Our menu</p><h2>{category === "All" ? "All products" : category}</h2></div><span className="result-count">{visibleProducts.length} items</span></div>
    {isLoading ? <div className="empty-state"><h2>Loading products...</h2></div> : error ? <div className="empty-state"><h2>Unable to load products</h2><p>{error}</p></div> : visibleProducts.length > 0 ? <section className="product-grid">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} />)}</section> : <div className="empty-state"><h2>No products found</h2><p>Try another search or category.</p></div>}
  </main></div>;
}