import Image from "next/image";

const imageNameMap = {
  "cheesecake.jpg": "cheese-cake.jpg",
  "coffee.jpg": "hot-coffee.jpg",
  "matcha-latte.jpg": "hot-matcha-latte.jpg",
};

function getImagePath(imageUrl) {
  if (!imageUrl) return "";
  const fileName = imageUrl.split("/").pop();
  return `/images/${imageNameMap[fileName] || fileName}`;
}

export default function ProductCard({ product, onAdd }) {
  const imagePath = getImagePath(product.imageUrl);

  return <article className="product-card"><div className="product-image" aria-label={`${product.name} image`}>{imagePath ? <Image src={imagePath} alt={product.name} width={400} height={240} style={{ height: "100%", objectFit: "cover", width: "100%" }} /> : product.icon}</div><div className="product-card-body"><div className="product-card-topline"><span className="product-category">{product.category}</span><span className="product-price">Rp {product.price.toLocaleString("id-ID")}</span></div><h3>{product.name}</h3><p>{product.description}</p><button className="add-button" onClick={() => onAdd(product)}>Add <span aria-hidden="true">+</span></button></div></article>;
}