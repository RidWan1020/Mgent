import Heading from "@Components/Heading";
import PrimaryButton from "@Components/PrimaryButton";
import SecondaryButton from "@Components/SecondaryButton";
import InputField from "@Components/InputField";
import NumberInputField from "@Components/NumberInputField";

import { useEffect, useMemo, useState } from "react";
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  addDoc,
  collection,
} from "firebase/firestore";
import { db } from "@Configs/firebase";
import { useAuth } from "@Context/AuthContext";
import { useNotification } from "@Context/NotificationContext";

const fmt = (n) => {
  if (!Number.isFinite(n)) return "0.00";
  return (Math.round(n * 100) / 100).toFixed(2);
};

export default function CartAndMemo() {
  const { user } = useAuth();
  const { notifyError, notifySuccess } = useNotification();

  const [cart, setCart] = useState({ items: [], loading: true });
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [localEditing, setLocalEditing] = useState({});

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
        notifyError("কার্ট লোড করতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন");
        setCart({ items: [], loading: false });
      }
    );

    return () => unsub();
  }, [user, notifyError]);

  const updateCartItems = async (newItems) => {
    if (!user || !user.uid) {
      notifyError("প্রথমে লগিন করুন");
      return;
    }
    try {
      await updateDoc(doc(db, "carts", user.uid), {
        items: newItems,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to update cart:", err);
      notifyError("কার্ট আপডেট করতে সমস্যা হয়েছে");
      throw err;
    }
  };

  const removeItem = async (productId) => {
    if (!user || !user.uid) {
      notifyError("প্রথমে লগিন করুন");
      return;
    }
    const newItems = (cart.items || []).filter(
      (i) => i.productId !== productId
    );
    try {
      await updateCartItems(newItems);
      setLocalEditing((p) => {
        const copy = { ...(p || {}) };
        if (copy[productId]) delete copy[productId];
        return copy;
      });
      notifySuccess("পণ্য সরানো হয়েছে");
    } catch (err) {}
  };

  const clearCart = async () => {
    if (!user || !user.uid) return;
    try {
      await updateCartItems([]);
      setLocalEditing({});
      setShopName("");
      setShopAddress("");
      notifySuccess("কার্ট ক্লিয়ার করা হয়েছে");
    } catch (err) {}
  };

  const setLocalField = (productId, patch) => {
    setLocalEditing((p) => ({
      ...(p || {}),
      [productId]: { ...(p?.[productId] || {}), ...patch },
    }));
  };

  const onDiscountChangeLocal = (productId, val) => {
    setLocalField(productId, { discount: val });
  };

  const saveDiscount = async (productId) => {
    if (!user || !user.uid) return;
    const raw = (localEditing[productId]?.discount ?? "").toString();
    const newDiscount = Math.max(0, Number(raw.trim() || 0));

    const items = (cart.items || []).map((it) =>
      it.productId === productId ? { ...it, discount: newDiscount } : it
    );

    try {
      await updateCartItems(items);
      notifySuccess("ডিসকাউন্ট আপডেট করা হয়েছে");
      setLocalEditing((p) => {
        const copy = { ...(p || {}) };
        if (copy[productId]) {
          delete copy[productId].discount;
          if (Object.keys(copy[productId]).length === 0) delete copy[productId];
        }
        return copy;
      });
    } catch (err) {}
  };

  const onQtyChangeLocal = (productId, patch) => {
    setLocalField(productId, patch);
  };

  const saveQty = async (productId) => {
    if (!user || !user.uid) return;

    const it = (cart.items || []).find((x) => x.productId === productId);
    if (!it) return;

    const boxInCarton = Number(it.boxInCarton ?? it.cartoonAmount ?? 1) || 1;
    const local = localEditing?.[productId] || {};

    const persistedTotalBoxes = Number(it.totalBoxes ?? it.qty ?? 0) || 0;
    const persistedCartons = Math.floor(persistedTotalBoxes / boxInCarton);
    const persistedBoxes = persistedTotalBoxes % boxInCarton;

    const cartonsLocal = Number(local.cartons ?? persistedCartons) || 0;
    const boxesLocal = Number(local.boxes ?? persistedBoxes) || 0;

    let cartons = Math.max(0, Math.floor(cartonsLocal));
    let boxes = Math.max(0, Math.floor(boxesLocal));
    if (boxes >= boxInCarton) {
      const extra = Math.floor(boxes / boxInCarton);
      cartons += extra;
      boxes = boxes % boxInCarton;
    }

    const totalBoxes = cartons * boxInCarton + boxes;

    const newItems = (cart.items || []).map((x) =>
      x.productId === productId ? { ...x, totalBoxes } : x
    );

    try {
      await updateCartItems(newItems);
      notifySuccess("পরিমাণ আপডেট করা হয়েছে");
      setLocalEditing((p) => {
        const copy = { ...(p || {}) };
        if (copy[productId]) {
          delete copy[productId].cartons;
          delete copy[productId].boxes;
          if (Object.keys(copy[productId]).length === 0) delete copy[productId];
        }
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
      const boxInCarton = Number(it.boxInCarton ?? it.cartoonAmount ?? 1) || 1;
      const local = localEditing?.[it.productId] || {};

      const persistedTotalBoxes = Number(it.totalBoxes ?? it.qty ?? 0) || 0;
      const persistedCartons = Math.floor(persistedTotalBoxes / boxInCarton);
      const persistedBoxes = persistedTotalBoxes % boxInCarton;

      const cartonsLocal = Number(local.cartons ?? persistedCartons) || 0;
      const boxesLocal = Number(local.boxes ?? persistedBoxes) || 0;
      const totalBoxes = Math.max(
        0,
        Math.floor(cartonsLocal) * boxInCarton + Math.floor(boxesLocal)
      );

      const unitPrice = Number(it.unitPrice || it.price || 0) || 0;
      const discount =
        Number(
          local.discount !== undefined
            ? Number(local.discount || 0)
            : Number(it.discount || 0)
        ) || 0;

      const lineBefore = unitPrice * totalBoxes;
      subtotal += lineBefore;
      discountSum += Math.max(0, discount);
      grandTotal += Math.max(0, lineBefore - Math.max(0, discount));
    });

    return { subtotal, discountSum, grandTotal };
  }, [cart, localEditing]);

  const isLoading = cart.loading;

  const createMemo = async () => {
    if (!user || !user.uid) {
      notifyError("প্রথমে লগিন করুন");
      return;
    }

    const items = cart.items || [];
    if (items.length === 0) {
      notifyError("কার্ট খালি");
      return;
    }

    if (!shopName?.toString().trim() || !shopAddress?.toString().trim()) {
      notifyError("দোকানের নাম ও ঠিকানা সঠিকভাবে পূরণ করুন");
      return;
    }

    const lines = items.map((it) => {
      const boxInCarton = Number(it.boxInCarton ?? it.cartoonAmount ?? 1) || 1;
      const local = localEditing?.[it.productId] || {};

      const persistedTotalBoxes = Number(it.totalBoxes ?? it.qty ?? 0) || 0;
      const persistedCartons = Math.floor(persistedTotalBoxes / boxInCarton);
      const persistedBoxes = persistedTotalBoxes % boxInCarton;

      const cartons = Number(local.cartons ?? persistedCartons) || 0;
      const boxes = Number(local.boxes ?? persistedBoxes) || 0;
      const normalizedCartons = Math.max(0, Math.floor(cartons));
      const normalizedBoxes = Math.max(0, Math.floor(boxes));
      const totalBoxes = Math.max(
        0,
        normalizedCartons * boxInCarton + normalizedBoxes
      );

      const unitPrice = Number(it.unitPrice || it.price || 0) || 0;
      const discount =
        Number(
          local.discount !== undefined
            ? Number(local.discount || 0)
            : Number(it.discount || 0)
        ) || 0;
      const lineBefore = unitPrice * totalBoxes;
      const lineAfter = Math.max(0, lineBefore - Math.max(0, discount));

      return {
        productId: it.productId,
        name: it.name,
        image: it.image,
        boxInCarton,
        cartons: Math.floor(totalBoxes / boxInCarton),
        boxes: totalBoxes % boxInCarton,
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
      shopName: shopName.trim(),
      shopAddress: shopAddress.trim(),
    };

    try {
      await addDoc(collection(db, "memos"), payload);
      notifySuccess("ক্যাশ মেমো তৈরি করা হয়েছে");
      await updateCartItems([]);
      setLocalEditing({});
      setShopName("");
      setShopAddress("");
    } catch (err) {
      console.error("Failed to create memo:", err);
      notifyError("ক্যাশ মেমো তৈরিতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন");
    }
  };

  return (
    <section className="bg-[#0b1024] border-2 border-solid border-[#1f2937] rounded-2xl shadow-[0_6px_28px_rgba(0,0,0,.25)]">
      <Heading text="🧾 আপনার কার্ট" />
      <div className="px-2.5 py-3">
        <div className="flex flex-col lg:flex-row items-center p-3 gap-3">
          <InputField
            label="দোকানের নাম"
            placeholder="রিদওয়ান সরকার ট্রেডার্স"
            id="shopName"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
          />
          <InputField
            label="দোকানের ঠিকানা"
            placeholder="ফিনলে স্কোয়ারের সামনে, ২নং গেইট"
            id="shopAddress"
            value={shopAddress}
            onChange={(e) => setShopAddress(e.target.value)}
          />
        </div>
        <div id="cartList" className="p-3">
          {isLoading ? (
            <div className="text-sm text-[#94a3b8] px-3 py-2">লোড হচ্ছে...</div>
          ) : !cart.items || cart.items.length === 0 ? (
            <p className="text-center text-gray-400">কার্ট খালি</p>
          ) : (
            cart.items.map((item) => {
              const boxInCarton =
                Number(item.boxInCarton ?? item.cartoonAmount ?? 1) || 1;
              const persistedTotalBoxes =
                Number(item.totalBoxes ?? item.qty ?? 0) || 0;
              const persistedCartons = Math.floor(
                persistedTotalBoxes / boxInCarton
              );
              const persistedBoxes = persistedTotalBoxes % boxInCarton;

              const localObj = localEditing?.[item.productId] || {};
              const cartonsLocal =
                Number(localObj.cartons ?? persistedCartons) || 0;
              const boxesLocal = Number(localObj.boxes ?? persistedBoxes) || 0;

              let normCartons = Math.max(0, Math.floor(cartonsLocal));
              let normBoxes = Math.max(0, Math.floor(boxesLocal));
              if (normBoxes >= boxInCarton) {
                const extra = Math.floor(normBoxes / boxInCarton);
                normCartons += extra;
                normBoxes = normBoxes % boxInCarton;
              }
              const totalBoxesLocal = normCartons * boxInCarton + normBoxes;

              const unitPrice = Number(item.unitPrice || item.price || 0) || 0;
              const appliedDiscount =
                Number(
                  localObj.discount !== undefined
                    ? Number(localObj.discount || 0)
                    : Number(item.discount || 0)
                ) || 0;

              const lineBefore = unitPrice * totalBoxesLocal;
              const lineTotal = Math.max(
                0,
                lineBefore - Math.max(0, appliedDiscount)
              );

              return (
                <div
                  key={item.productId}
                  className="flex flex-col sm:flex-row items-start border-2 border-[#1f2937] rounded-xl p-3 bg-[#071225] gap-2"
                >
                  <div className="flex items-center justify-center p-2">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-30 h-30 object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-normal text-base">{item.name}</div>
                        <div className="text-xs text-[#94a3b8] mt-1">
                          {normCartons.toLocaleString("bn-BD")} কার্টন এবং{" "}
                          {normBoxes.toLocaleString("bn-BD")} বক্স
                        </div>
                      </div>

                      <div className="flex-shrink-0 text-right ml-2">
                        <div className="font-semibold text-green-400 whitespace-nowrap">
                          মোট: {Number(fmt(lineTotal)).toLocaleString("bn-BD")}{" "}
                          টাকা
                        </div>
                        <div className="text-xs text-[#94a3b8] whitespace-nowrap">
                          ডিস্কাউন্ট ছাড়া:{" "}
                          {Number(fmt(lineBefore)).toLocaleString("bn-BD")} টাকা
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex flex-col md:flex-row gap-2">
                        <NumberInputField
                          id={`cartons-${item.productId}`}
                          label="কার্টন"
                          min={0}
                          value={String(localObj.cartons ?? persistedCartons)}
                          onChange={(e) =>
                            onQtyChangeLocal(item.productId, {
                              cartons: e.target.value,
                            })
                          }
                          onBlur={() => saveQty(item.productId)}
                        />
                        <NumberInputField
                          id={`boxes-${item.productId}`}
                          label="বক্স"
                          min={0}
                          value={String(localObj.boxes ?? persistedBoxes)}
                          onChange={(e) =>
                            onQtyChangeLocal(item.productId, {
                              boxes: e.target.value,
                            })
                          }
                          onBlur={() => saveQty(item.productId)}
                        />
                        <NumberInputField
                          id={`discount-${item.productId}`}
                          label="ডিসকাউন্ট (৳)"
                          min={0}
                          value={String(
                            localObj.discount !== undefined
                              ? localObj.discount
                              : item.discount ?? 0
                          )}
                          onChange={(e) =>
                            onDiscountChangeLocal(
                              item.productId,
                              e.target.value
                            )
                          }
                          onBlur={() => saveDiscount(item.productId)}
                        />
                      </div>

                      <div className="mt-2">
                        <SecondaryButton
                          text="রিমুভ"
                          onClick={() => removeItem(item.productId)}
                        />
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
            <div className="gap-1.5 items-center bg-[#061227] border border-[#2c4466] text-[#93c5fd] px-4 py-3 rounded-xl text-sm">
              মোট: {Number(fmt(totals.grandTotal)).toLocaleString("bn-BD")} টাকা
            </div>
          </div>

          <div className="flex gap-2">
            <PrimaryButton text="মেমো তৈরি" onClick={createMemo} />
            <SecondaryButton text="কার্ট ক্লিয়ার" onClick={clearCart} />
          </div>
        </div>
      </div>
    </section>
  );
}

