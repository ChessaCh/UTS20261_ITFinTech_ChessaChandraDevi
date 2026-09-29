import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";

const CART_KEY = "payment-gateway-cart";
const products = [
  { id: "coffee", name: "Coffee", category: "Drinks", price: 18000, description: "Freshly brewed coffee with a smooth finish.", icon: "Coffee" },
  { id: "tea", name: "Tea", category: "Drinks", price: 12000, description: "A warm, calming cup for any time of day.", icon: "Tea" },
  { id: "cola", name: "Coca-Cola", category: "Drinks", price: 10000, description: "A chilled classic served ready to refresh.", icon: "Cola" },
  { id: "chips", name: "Potato Chips", category: "Snacks", price: 14000, description: "Crispy, lightly salted and easy to share.", icon: "Chips" },
  { id: "chocolate", name: "Chocolate", category: "Dessert", price: 16000, description: "Rich chocolate for a small sweet treat.", icon: "Cocoa" },
  { id: "burger", name: "Burger", category: "Food", price: 32000, description: "A satisfying burger with fresh toppings.", icon: "Burger" },
  { id: "sandwich", name: "Sandwich", category: "Food", price: 26000, description: "A light and filling sandwich made fresh.", icon: "Sandwich" },
  { id: "cake", name: "Cake", category: "Dessert", price: 22000, description: "Soft cake with a delicate, sweet topping.", icon: "Cake" },
];
const categories = ["All", "Drinks", "Snacks", "Food", "Dessert"];

function readCart() {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(CART_KEY)) || []; } catch { return []; }
}

export default function Home() {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [notification, setNotification] = useState("");
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
  }), [category, search]);
  const cartQuantity = cart.reduce((total, item) => total + item.quantity, 0);

  return <div className="site-shell"><Navbar cartCount={cartQuantity} /><main className="page-container">
    <section className="intro-section"><div><p className="eyebrow">Fresh picks, simple checkout</p><h1>Choose something good.</h1><p className="intro-copy">Browse the menu and build your order in a few clicks.</p></div><Link className="outline-button" href="/checkout">View cart <span aria-hidden="true">-&gt;</span></Link></section>{notification && <div className="cart-notification" role="status">{notification}</div>}
    <section className="catalog-controls" aria-label="Product filters"><label className="search-box"><span aria-hidden="true">Search</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" aria-label="Search products" /></label><div className="category-list">{categories.map((item) => <button className={category === item ? "category-button active" : "category-button"} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div></section>
    <div className="section-heading"><div><p className="eyebrow">Our menu</p><h2>{category === "All" ? "All products" : category}</h2></div><span className="result-count">{visibleProducts.length} items</span></div>
    {visibleProducts.length > 0 ? <section className="product-grid">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} />)}</section> : <div className="empty-state"><h2>No products found</h2><p>Try another search or category.</p></div>}
  </main></div>;
}