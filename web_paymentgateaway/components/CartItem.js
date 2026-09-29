import Image from "next/image";
import { getProductImagePath } from "../lib/productImage";

export default function CartItem({ item, onIncrease, onDecrease, onRemove }) {
  const imagePath = getProductImagePath(item.imageUrl);

  return <article className="cart-item"><div className="cart-item-identity"><div className="cart-item-visual" aria-hidden="true">{imagePath ? <Image src={imagePath} alt="" width={136} height={136} /> : item.name.slice(0, 1)}</div><div><h3>{item.name}</h3><p>Rp {item.price.toLocaleString("id-ID")} each</p></div></div><div className="cart-item-actions"><div className="quantity-control" aria-label={`Quantity for ${item.name}`}><button type="button" onClick={() => onDecrease(item.productId)} aria-label={`Decrease ${item.name}`}>-</button><strong>{item.quantity}</strong><button type="button" onClick={() => onIncrease(item.productId)} aria-label={`Increase ${item.name}`}>+</button></div><strong className="item-subtotal">Rp {(item.price * item.quantity).toLocaleString("id-ID")}</strong><button type="button" className="remove-button" onClick={() => onRemove(item.productId)} aria-label={`Remove ${item.name} from cart`}>Remove</button></div></article>;
}