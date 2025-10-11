// src/utils/cart.js
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../Config/firebase";

/**
 * addToCart(userId, product, totalBoxes)
 * - product must contain either product.id or product.productId
 * - totalBoxes must be a non-negative integer (boxes)
 *
 * IMPORTANT: do NOT use serverTimestamp() inside array elements.
 * We use Timestamp.now() (client timestamp) for item.addedAt and
 * use serverTimestamp() only at the document root (updatedAt).
 */
export async function addToCart(userId, product, totalBoxes) {
  if (!userId) throw new Error("addToCart: userId required");
  if (!product || !(product.id || product.productId))
    throw new Error("addToCart: product id required");

  const pid = product.id ?? product.productId;
  const boxInCarton =
    Number(product.boxInCarton ?? product.cartoonAmount ?? 1) || 1;
  const tBoxes = Math.max(0, Math.floor(Number(totalBoxes) || 0));

  const cartons = Math.floor(tBoxes / boxInCarton);
  const boxes = tBoxes % boxInCarton;

  // Use Timestamp.now() (client-side Firestore Timestamp) inside array item
  const newItem = {
    productId: pid,
    name: product.name || "",
    image: product.image ?? product.imageUrl ?? null, // <-- add this
    unitPrice: Number(product.price || 0), // price per box
    totalBoxes: tBoxes,
    cartons,
    boxes,
    boxInCarton,
    qty: tBoxes,
    discount: Number(product.discount || 0) || 0,
    addedAt: Timestamp.now(),
  };

  const cartRef = doc(db, "carts", userId);

  try {
    const snap = await getDoc(cartRef);
    if (!snap.exists()) {
      // create doc: ok to set updatedAt: serverTimestamp() at document root
      await setDoc(cartRef, { items: [newItem], updatedAt: serverTimestamp() });
      return;
    }

    const cart = snap.data();
    const items = Array.isArray(cart.items) ? cart.items.slice() : [];

    const idx = items.findIndex((i) => i.productId === pid);
    if (idx >= 0) {
      // merge behaviour: add quantities
      const existing = items[idx];
      const mergedTotal = (existing.totalBoxes || 0) + tBoxes;
      const mergedCartons = Math.floor(mergedTotal / boxInCarton);
      const mergedBoxes = mergedTotal % boxInCarton;
      items[idx] = {
        ...existing,
        totalBoxes: mergedTotal,
        cartons: mergedCartons,
        boxes: mergedBoxes,
        qty: mergedTotal,
        // avoid serverTimestamp() inside array: use Timestamp.now()
        updatedAt: Timestamp.now(),
      };
    } else {
      items.push(newItem);
    }

    // updateDoc with serverTimestamp at document root (allowed)
    await updateDoc(cartRef, { items, updatedAt: serverTimestamp() });
  } catch (err) {
    console.error("addToCart error:", err);
    throw err;
  }
}

export default addToCart;
