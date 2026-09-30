import Image from "next/image";
import { useState } from "react";
import { getProductImagePath } from "../lib/productImage";

export default function ProductCard({ product, onAdd }) {
  const [isAdded, setIsAdded] = useState(false);
  const imagePath = getProductImagePath(product.imageUrl);

  function handleAdd() {
    onAdd(product);
    setIsAdded(true);
    window.setTimeout(() => setIsAdded(false), 1600);
  }

  return <article className="product-card"><div className="product-image" aria-label={`${product.name} image`}>{imagePath ? <Image src={imagePath} alt={product.name} width={400} height={240} style={{ height: "100%", objectFit: "cover", width: "100%" }} /> : <span className="image-placeholder">{product.icon}</span>}</div><div className="product-card-body"><div className="product-card-topline"><span className="product-category">{product.category}</span></div><h3>{product.name}</h3><p>{product.description}</p><div className="product-card-footer"><span className="product-price">Rp {product.price.toLocaleString("id-ID")}</span><button type="button" className={`add-button${isAdded ? " added" : ""}`} onClick={handleAdd} aria-label={`Add ${product.name} to cart`}>{isAdded ? "Added" : "Add"} <span aria-hidden="true">{isAdded ? "OK" : "+"}</span></button></div></div></article>;
}