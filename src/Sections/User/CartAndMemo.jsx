import Heading from "../../Components/Heading";
import PrimaryButton from "../../Components/PrimaryButton";
import SecondaryButton from "../../Components/SecondaryButton";
import NumberInputField from "../../Components/NumberInputField";

import { useEffect, useMemo, useState } from "react";
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  addDoc,
  collection,
} from "firebase/firestore";
import { db } from "../../../Config/firebase";
import { useAuth } from "../../../Context/AuthContext";
import { useNotification } from "../../../Context/NotificationContext";

/* Small helper */
const fmt = (n) => {
  if (!Number.isFinite(n)) return "0.00";
  return (Math.round(n * 100) / 100).toFixed(2);
};

export default function CartAndMemo() {
  const { user } = useAuth();
  const { notifyError, notifySuccess } = useNotification();

  const [cart, setCart] = useState({ items: [], loading: true });
  const [localEditing, setLocalEditing] = useState({}); // { [productId]: "12.5" }

  useEffect(() => {
    if (!user || !user.uid) {
      setCart({ items: [], loading: false });
      return;
    }

    setCart((c) => ({ ...(c || {}), loading: true }));
    const cartRef = doc(db, "carts", user.uid);
    const unsub = onSnapshot(
      cartRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setCart({
            items: Array.isArray(data.items) ? data.items : [],
            loading: false,
          });
        } else {
          setCart({ items: [], loading: false });
        }
      },
      (err) => {
        console.error("cart onSnapshot error:", err);
        notifyError("Failed to load cart.");
        setCart({ items: [], loading: false });
      }
    );

    return () => unsub();
  }, [user, notifyError]);

  const updateCartItems = async (newItems) => {
    if (!user || !user.uid) {
      notifyError("No user.");
      return;
    }
    try {
      await updateDoc(doc(db, "carts", user.uid), {
        items: newItems,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to update cart:", err);
      notifyError("Failed to update cart.");
      throw err;
    }
  };

  const removeItem = async (productId) => {
    if (!user || !user.uid) {
      notifyError("প্রথমে সাইন ইন করুন।");
      return;
    }
    const newItems = (cart.items || []).filter((i) => i.productId !== productId);
    try {
      await updateCartItems(newItems);
      notifySuccess("Item removed");
    } catch (err) {}
  };

  const clearCart = async () => {
    if (!user || !user.uid) return;
    try {
      await updateCartItems([]);
      notifySuccess("Cart cleared");
    } catch (err) {}
  };

  const onDiscountChangeLocal = (productId, val) => {
    setLocalEditing((p) => ({ ...p, [productId]: val }));
  };

  const saveDiscount = async (productId) => {
    if (!user || !user.uid) return;
    const raw = localEditing[productId];
    const newDiscount = Math.max(0, Number((raw ?? "").toString().trim() || 0));

    const items = (cart.items || []).map((it) =>
      it.productId === productId ? { ...it, discount: newDiscount } : it
    );

    try {
      await updateCartItems(items);
      notifySuccess("Discount updated");
      setLocalEditing((p) => {
        const copy = { ...p };
        delete copy[productId];
        return copy;
      });
    } catch (err) {}
  };

  const totals = useMemo(() => {
    const items = cart.items || [];
    let subtotal = 0;
    let discountSum = 0;
    let grandTotal = 0;

    items.forEach((it) => {
      const unitPrice = Number(it.unitPrice || 0); // price per box
      const totalBoxes = Number(it.totalBoxes ?? it.qty ?? 0);
      const discount = Number(it.discount || 0);

      const lineBefore = unitPrice * totalBoxes;
      subtotal += lineBefore;
      discountSum += Math.max(0, discount);
      grandTotal += Math.max(0, lineBefore - Math.max(0, discount));
    });

    return { subtotal, discountSum, grandTotal };
  }, [cart]);

  const isLoading = cart.loading;

  // --- CREATE MEMO ---
  const createMemo = async () => {
    if (!user || !user.uid) {
      notifyError("প্রথমে সাইন ইন করুন।");
      return;
    }

    const items = cart.items || [];
    if (items.length === 0) {
      notifyError("কার্ট খালি।");
      return;
    }

    // Build line items
    const lines = items.map((it) => {
      const boxInCarton = Number(it.boxInCarton ?? it.cartoonAmount ?? 1) || 1;
      const totalBoxes = Number(it.totalBoxes ?? it.qty ?? 0);
      const cartons = Math.floor(totalBoxes / boxInCarton);
      const boxes = totalBoxes % boxInCarton;
      const unitPrice = Number(it.unitPrice || it.price || 0);
      const discount = Number(it.discount || 0);
      const lineBefore = unitPrice * totalBoxes;
      const lineAfter = Math.max(0, lineBefore - Math.max(0, discount));

      return {
        productId: it.productId,
        name: it.name,
        image: it.image ?? it.imageUrl ?? null,
        boxInCarton,
        cartons,
        boxes,
        totalBoxes,
        unitPrice,
        discount,
        lineBefore,
        lineAfter,
      };
    });

    const payload = {
      userId: user.uid,
      userName: user.displayName || user.phoneNumber || user.email || "Unknown",
      items: lines,
      totals: {
        subtotal: totals.subtotal,
        totalDiscount: totals.discountSum,
        grandTotal: totals.grandTotal,
      },
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, "memos"), payload);
      notifySuccess("Memo created successfully");
      // clear cart after creating memo
      await updateCartItems([]);
    } catch (err) {
      console.error("Failed to create memo:", err);
      notifyError("Failed to create memo. Check console.");
    }
  };

  return (
    <section className="bg-[#0b1024] border-2 border-solid border-[#1f2937] rounded-2xl shadow-[0_6px_28px_rgba(0,0,0,.25)]">
      <Heading text="🧾 কার্ট ও মেমো" />
      <div id="cartList" className="p-3">
        {isLoading ? (
          <div className="text-sm text-[#94a3b8] px-3 py-2">লোড হচ্ছে...</div>
        ) : !cart.items || cart.items.length === 0 ? (
          <p className="text-center text-gray-400">কার্ট খালি</p>
        ) : (
          cart.items.map((item) => {
            const boxInCarton =
              Number(item.boxInCarton ?? item.cartoonAmount ?? 1) || 1;
            const totalBoxes = Number(item.totalBoxes ?? item.qty ?? 0) || 0;
            const cartons = Math.floor(totalBoxes / boxInCarton);
            const boxes = totalBoxes % boxInCarton;
            const unitPrice = Number(item.unitPrice || item.price || 0);
            const local = localEditing[item.productId];
            const appliedDiscount =
              local !== undefined ? Number(local || 0) : Number(item.discount || 0);
            const lineBefore = unitPrice * totalBoxes;
            const lineTotal = Math.max(0, lineBefore - Math.max(0, appliedDiscount));

            return (
              <div
                key={item.productId}
                className="flex flex-col sm:flex-row items-start border-2 border-[#1f2937] rounded-xl p-3 bg-[#071225]"
              >
                {/* left: image */}
                <div className="w-full sm:w-24 flex-shrink-0 mr-0 sm:mr-4 mb-3 sm:mb-0">
                  <img
                    src={item.image || item.imageUrl || "/placeholder-rect.png"}
                    alt={item.name || "Product image"}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                </div>

                {/* center: main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    {/* title + meta */}
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{item.name}</div>
                      <div className="text-xs text-[#94a3b8] mt-1">
                        {cartons} কার্টুন এবং {boxes} বক্স
                      </div>
                    </div>

                    {/* right: price (top-right, won't wrap) */}
                    <div className="flex-shrink-0 text-right ml-2">
                      <div className="font-semibold text-green-400 whitespace-nowrap">
                        মোট: ৳{fmt(lineTotal)}
                      </div>
                      <div className="text-xs text-[#94a3b8] whitespace-nowrap">
                        ডিস্কাউন্ট ছাড়া: ৳{fmt(lineBefore)}
                      </div>
                    </div>
                  </div>

                  {/* controls: discount (line 1) + remove (next line) */}
                  <div className="mt-3">
                    <div className="w-full max-w-sm">
                      <NumberInputField
                        id={`discount-${item.productId}`}
                        label="ডিসকাউন্ট (৳)"
                        min={0}
                        value={String(local !== undefined ? local : item.discount ?? 0)}
                        onChange={(e) => onDiscountChangeLocal(item.productId, e.target.value)}
                        onBlur={() => saveDiscount(item.productId)}
                      />
                    </div>

                    {/* remove button forced to next line */}
                    <div className="mt-2">
                      <SecondaryButton text="রিমুভ" onClick={() => removeItem(item.productId)} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center px-3 pb-3 justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="gap-1.5 items-center bg-[#061227] border border-[#2c4466] text-[#93c5fd] px-2 py-1 rounded-full text-sm">
            সাবটোটাল: ৳{fmt(totals.subtotal)}
          </div>
          <div className="gap-1.5 items-center bg-[#061227] border border-[#2c4466] text-[#93c5fd] px-2 py-1 rounded-full text-sm">
            মোট ডিসকাউন্ট: ৳{fmt(totals.discountSum)}
          </div>
          <div className="gap-1.5 items-center bg-[#061227] border border-[#2c4466] text-[#93c5fd] px-2 py-1 rounded-full text-sm">
            মোট: ৳{fmt(totals.grandTotal)}
          </div>
        </div>

        <div className="flex gap-2">
          <PrimaryButton text="মেমো তৈরি" onClick={createMemo} />
          <SecondaryButton text="কার্ট ক্লিয়ার" onClick={clearCart} />
        </div>
      </div>
    </section>
  );
}
