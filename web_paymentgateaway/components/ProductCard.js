import Image from "next/image";
import { getProductImagePath } from "../lib/productImage";

export default function ProductCard({ product, onAdd }) {
  const imagePath = getProductImagePath(product.imageUrl);

  return <article className="product-card"><div className="product-image" aria-label={`${product.name} image`}>{imagePath ? <Image src={imagePath} alt={product.name} width={400} height={240} style={{ height: "100%", objectFit: "cover", width: "100%" }} /> : product.icon}</div><div className="product-card-body"><div className="product-card-topline"><span className="product-category">{product.category}</span><span className="product-price">Rp {product.price.toLocaleString("id-ID")}</span></div><h3>{product.name}</h3><p>{product.description}</p><button className="add-button" onClick={() => onAdd(product)}>Add <span aria-hidden="true">+</span></button></div></article>;
}