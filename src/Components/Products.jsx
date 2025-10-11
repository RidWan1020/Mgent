import { useLocation } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import { doc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../../Config/firebase";
import { useState, useEffect } from "react";
import { addToCart } from "../../utils/cart";

import PrimaryButton from "../Components/PrimaryButton";
import SecondaryButton from "../Components/SecondaryButton";
import Inputfield from "../Components/InputField";
import NumberInputField from "../Components/NumberInputField";
import SelectInput from "../Components/SelectInput";

import { useNotification } from "../../Context/NotificationContext";

const FIELDS = {
  NAME: "নাম",
  SKU: "SKU",
  IMAGE: "ছবি",
  BOXES: "বক্স", // total boxes
  CARTONS: "কার্টুন", // total cartons
  BOX_PER_CARTON: "কার্টুনে বক্স", // conversion factor
  PUR_PRICE: "ক্রয়মূল্য",
  SELL_PRICE: "বিক্রয়মূল্য",
};

export default function Products({ product }) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedField, setSelectedField] = useState("");
  const [userPrices, setUserPrices] = useState(null);
  const { notifySuccess, notifyError } = useNotification();
  const { user } = useAuth();
  const [cartonQty, setCartonQty] = useState(0);
  const [boxQty, setBoxQty] = useState(0);

  const [editValue, setEditValue] = useState("");

  const options = [
    FIELDS.NAME,
    FIELDS.SKU,
    FIELDS.IMAGE,
    FIELDS.BOXES,
    FIELDS.CARTONS,
    FIELDS.BOX_PER_CARTON,
    FIELDS.PUR_PRICE,
    FIELDS.SELL_PRICE,
  ];

  const location = useLocation();
  const isAdminPage = location.pathname.includes("/admin");

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "userPrices", user.uid));
        if (!mounted) return;
        setUserPrices(snap.exists() ? snap.data() : {});
      } catch (err) {
        console.error("userPrices load error:", err);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [user]);

  const effective = userPrices
    ? userPrices[product.id] ?? product.price
    : product.price;

  const handleAddToCart = async () => {
    try {
      // guard user
      if (!user || !user.uid) {
        notifyError("প্রথমে সাইন ইন করুন।");
        console.warn("addToCart aborted: no user or user.uid", { user });
        return;
      }

      // ensure product id exists
      const pid = product.id ?? product.productId;
      if (!pid) {
        notifyError("এই প্রোডাক্টে ID নেই, কার্টে যোগ করা সম্ভব নেই।");
        console.error("addToCart aborted: product missing id", { product });
        return;
      }

      // parse inputs
      const cartonNum = Math.max(0, Math.floor(Number(cartonQty) || 0));
      let boxNum = Math.max(0, Math.floor(Number(boxQty) || 0));
      const boxPer = getBoxInCarton() || 1;

      // normalize overflow boxes -> cartons (optional UX: you might update UI instead)
      if (boxNum >= boxPer) {
        const extra = Math.floor(boxNum / boxPer);
        boxNum = boxNum % boxPer;
        // you can also reflect extra in cartonNum if you want:
        // cartonNum = cartonNum + extra; // if cartons variable were let
        // we won't mutate state here; just compute totalBoxes below
        console.info(`Converting overflow boxes to cartons: extra=${extra}`);
      }

      const totalBoxes = cartonNum * boxPer + boxNum;

      if (!Number.isFinite(totalBoxes) || totalBoxes <= 0) {
        notifyError("পরিমাণ ১ বা তার বেশি হতে হবে।");
        console.warn("Invalid totalBoxes", {
          cartonNum,
          boxNum,
          boxPer,
          totalBoxes,
        });
        return;
      }

      // a minimal product object to pass to util
      // inside Products component, handleAddToCart
      const productForCart = {
        id: pid,
        name: product.name,
        price: product.price,
        image: product.image ?? product.imageUrl ?? null, // <-- add this
        boxInCarton: product.boxInCarton ?? product.cartoonAmount ?? 1,
      };

      console.debug("addToCart ->", {
        userId: user.uid,
        product: productForCart,
        totalBoxes,
      });

      await addToCart(user.uid, productForCart, totalBoxes);
      notifySuccess(`✅ ${product.name} কার্টে যোগ হয়েছে!`);

      // reset UI
      setCartonQty(0);
      setBoxQty(0);
    } catch (err) {
      console.error("handleAddToCart error:", err);
      const message =
        err?.message || "কার্টে যোগ করতে সমস্যা হয়েছে। কনসোলে দেখুন।";
      notifyError(message);
    }
  };

  const toggleEdit = () => {
    setIsEditing((p) => !p);
    setSelectedField("");
    setEditValue("");
  };

  const deleteProduct = async (id) => {
    if (!id) {
      notifyError("Product ID is required");
      return;
    }

    try {
      await deleteDoc(doc(db, "products", id));
      notifySuccess(`✅ ${product.name} সফলভাবে ডিলিট হয়েছে!`);
    } catch (err) {
      console.error(err);
      notifyError("❌ Error deleting product");
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      `আপনি কি নিশ্চিত যে "${product.name}" মুছে ফেলতে চান?`
    );
    if (!confirmDelete) return;

    try {
      await deleteProduct(product.id);
    } catch (err) {
      notifyError("ডিলিট করতে ব্যর্থ। আবার চেষ্টা করুন।");
    }
  };

  const getBoxInCarton = () =>
    product.boxInCarton ?? product.cartoonAmount ?? 1;

  const getSubmitted = () => {
    const boxInCarton = getBoxInCarton();
    const submittedCartons = product.inventory?.submittedCartons ?? null;
    const submittedBoxes = product.inventory?.submittedBoxes ?? null;

    if (submittedCartons !== null && submittedBoxes !== null) {
      return { submittedCartons, submittedBoxes };
    }

    const totalBoxes =
      typeof product.stock === "number"
        ? product.stock
        : product.inventory?.totalBoxes ?? 0;
    const sc = Math.floor(totalBoxes / boxInCarton);
    const sb = totalBoxes % boxInCarton;
    return { submittedCartons: sc, submittedBoxes: sb };
  };

  const displayStockFromTotalBoxes = (totalBoxes, boxInCarton) => {
    const cartons = Math.floor(totalBoxes / boxInCarton);
    const boxes = totalBoxes % boxInCarton;
    return { cartons, boxes };
  };

  const boxInCartonCurrent = getBoxInCarton();

  const totalBoxes =
    typeof product.stock === "number"
      ? product.stock
      : product.inventory?.totalBoxes ?? 0;

  const { cartons: displayCartons, boxes: displayBoxes } =
    displayStockFromTotalBoxes(totalBoxes, boxInCartonCurrent);

  const handleEdit = async (e) => {
    e.preventDefault();

    try {
      const productRef = doc(db, "products", product.id);
      let updateData = {};

      switch (selectedField) {
        case FIELDS.NAME: {
          const v = (editValue || "").trim();
          if (!v) {
            notifyError("নাম লিখুন।");
            return;
          }
          updateData = { name: v };
          break;
        }

        case FIELDS.SKU: {
          const v = (editValue || "").trim();
          if (!v) {
            notifyError("SKU লিখুন।");
            return;
          }
          updateData = { sku: v };
          break;
        }

        case FIELDS.IMAGE: {
          const v = (editValue || "").trim();
          if (!v) {
            notifyError("ছবির URL দিন।");
            return;
          }
          updateData = { image: v };
          break;
        }

        case FIELDS.BOXES: {
          // Admin sets total boxes directly (submittedBoxes = newValue, keep submittedCartons)
          const v = parseInt(
            String(editValue || "")
              .replace(/,/g, "")
              .trim() || "0",
            10
          );
          if (!Number.isFinite(v) || v < 0) {
            notifyError("বৈধ বক্স সংখ্যা দিন (0 বা ধনাত্মক)।");
            return;
          }

          // get current submittedCartons (fallback to deriving from stock)
          const { submittedCartons, submittedBoxes: _ } = getSubmitted();

          // set submittedBoxes to v, keep submittedCartons
          const newSubmittedCartons = submittedCartons ?? 0;
          const newSubmittedBoxes = v;

          const boxInCarton = getBoxInCarton();
          const total = newSubmittedCartons * boxInCarton + newSubmittedBoxes;
          const normalizedCartons = Math.floor(total / boxInCarton);
          const normalizedBoxes = total % boxInCarton;

          updateData = {
            stock: total,
            boxInCarton: boxInCarton,
            inventory: {
              submittedCartons: newSubmittedCartons,
              submittedBoxes: newSubmittedBoxes,
              cartons: normalizedCartons,
              boxes: normalizedBoxes,
              totalBoxes: total,
            },
          };
          break;
        }

        case FIELDS.CARTONS: {
          // Admin sets submitted cartons (preserve displayed remainder)
          const v = parseInt(
            String(editValue || "")
              .replace(/,/g, "")
              .trim() || "0",
            10
          );
          if (!Number.isFinite(v) || v < 0) {
            notifyError("বৈধ কার্টুন সংখ্যা দিন (0 বা ধনাত্মক)।");
            return;
          }

          const boxInCarton = getBoxInCarton();

          // derive current display remainder (displayBoxes) from totalBoxes
          const currTotalBoxes =
            typeof product.stock === "number"
              ? product.stock
              : product.inventory?.totalBoxes ?? 0;
          const currentDisplayBoxes = currTotalBoxes % boxInCarton;

          // Now set submittedCartons = v and submittedBoxes = currentDisplayBoxes
          const newSubmittedCartons = v;
          const newSubmittedBoxes = currentDisplayBoxes;

          const total = newSubmittedCartons * boxInCarton + newSubmittedBoxes;
          const normalizedCartons = Math.floor(total / boxInCarton);
          const normalizedBoxes = total % boxInCarton;

          updateData = {
            stock: total,
            boxInCarton: boxInCarton,
            inventory: {
              submittedCartons: newSubmittedCartons,
              submittedBoxes: newSubmittedBoxes,
              cartons: normalizedCartons,
              boxes: normalizedBoxes,
              totalBoxes: total,
            },
          };
          break;
        }

        case FIELDS.BOX_PER_CARTON: {
          // Admin updates boxInCarton; keep submitted values unchanged and recompute normalized display
          const v = parseInt(
            String(editValue || "")
              .replace(/,/g, "")
              .trim() || "0",
            10
          );
          if (!Number.isFinite(v) || v <= 0) {
            notifyError("কার্টুনে বক্সের সংখ্যা (কমপক্ষে 1) দিন।");
            return;
          }

          // get submitted values (or derive)
          const { submittedCartons, submittedBoxes } = getSubmitted();
          const newSubmittedCartons = submittedCartons ?? 0;
          const newSubmittedBoxes = submittedBoxes ?? 0;

          // totalBoxes remains based on submitted values (unchanged)
          const total = newSubmittedCartons * v + newSubmittedBoxes;
          const normalizedCartons = Math.floor(total / v);
          const normalizedBoxes = total % v;

          updateData = {
            boxInCarton: v,
            stock: total,
            inventory: {
              submittedCartons: newSubmittedCartons,
              submittedBoxes: newSubmittedBoxes,
              cartons: normalizedCartons,
              boxes: normalizedBoxes,
              totalBoxes: total,
            },
          };
          break;
        }

        case FIELDS.PUR_PRICE: {
          const v = Number(
            String(editValue || "")
              .replace(/,/g, "")
              .trim()
          );
          if (!Number.isFinite(v) || v <= 0) {
            notifyError("বৈধ ক্রয়মূল্য দিন।");
            return;
          }
          updateData = { pur_price: v };
          break;
        }

        case FIELDS.SELL_PRICE: {
          const v = Number(
            String(editValue || "")
              .replace(/,/g, "")
              .trim()
          );
          if (!Number.isFinite(v) || v <= 0) {
            notifyError("বৈধ বিক্রয়মূল্য দিন।");
            return;
          }
          updateData = { price: v };
          break;
        }

        default:
          notifyError("অনুগ্রহ করে একটি ফিল্ড সিলেক্ট করুন।");
          return;
      }

      await updateDoc(productRef, updateData);
      notifySuccess("✅ প্রোডাক্ট সফলভাবে আপডেট হয়েছে!");
      setIsEditing(false);
      setSelectedField("");
      setEditValue("");
    } catch (err) {
      console.error(err);
      notifyError("❌ প্রোডাক্ট আপডেট করতে সমস্যা হয়েছে!");
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start border-2 border-[#1f2937] rounded-xl p-2 bg-[#071225]">
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-auto sm:w-30 sm:h-30 object-cover rounded-lg"
      />
      <div className="flex-1 mt-2 sm:mt-0 sm:ml-4">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-2.5 mb-2">
          <div>
            <div className="font-semibold">{product.name}</div>
            <div className="text-xs text-[#94a3b8]">SKU: {product.sku}</div>
            <div className="text-xs text-[#94a3b8] my-2">
              ১ কার্টুন = {getBoxInCarton()} বক্স
            </div>
          </div>
          <div className="text-left sm:text-right">
            {user && isAdminPage ? (
              <div>
                বিক্রয়মূল্য: {product.price} <br />
                ক্রয়মূল্য: {product.pur_price}
              </div>
            ) : (
              <div className="font-semibold text-green-400">
                মূল্য: {effective}
              </div>
            )}
            <div className="text-xs text-[#94a3b8]">
              স্টক: {displayCartons} কার্টুন এবং {displayBoxes} বক্স
            </div>
          </div>
        </div>

        <div className="flex flex-row items-center gap-2">
          {user && isAdminPage ? (
            <div id="editButton" className="flex flex-col gap-2">
              <div className="flex gap-2.5">
                <PrimaryButton text="এডিট" onClick={toggleEdit} />
                <SecondaryButton text="ডিলিট" onClick={handleDelete} />
              </div>

              {isEditing && (
                <form
                  onSubmit={handleEdit}
                  className="flex flex-wrap items-center gap-1 mt-2"
                >
                  <div className="flex flex-wrap gap-2 p-2">
                    <SelectInput
                      id="editSelection"
                      dis="ফিল্ড"
                      options={options}
                      value={selectedField}
                      onChange={(e) => {
                        setSelectedField(e.target.value);
                        setEditValue("");
                      }}
                    />

                    {selectedField === FIELDS.NAME && (
                      <Inputfield
                        id="newName"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="A4 Paper 80 GSM"
                      />
                    )}
                    {selectedField === FIELDS.SKU && (
                      <Inputfield
                        id="newSKU"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="A4-80"
                      />
                    )}
                    {selectedField === FIELDS.IMAGE && (
                      <Inputfield
                        id="newImage"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="https://..."
                      />
                    )}
                    {selectedField === FIELDS.BOXES && (
                      <NumberInputField
                        id="newBox"
                        min={0}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                      />
                    )}
                    {selectedField === FIELDS.CARTONS && (
                      <NumberInputField
                        id="newCartoon"
                        min={0}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                      />
                    )}
                    {selectedField === FIELDS.BOX_PER_CARTON && (
                      <NumberInputField
                        id="newBoxInCarton"
                        min={1}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                      />
                    )}
                    {selectedField === FIELDS.PUR_PRICE && (
                      <NumberInputField
                        id="newPurchasePrice"
                        min={1}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                      />
                    )}
                    {selectedField === FIELDS.SELL_PRICE && (
                      <NumberInputField
                        id="newSellPrice"
                        min={1}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                      />
                    )}
                  </div>

                  <div className="flex gap-2.5">
                    <PrimaryButton type="submit" text="কনফার্ম" />
                    <SecondaryButton
                      type="button"
                      text="ক্যান্সেল"
                      onClick={toggleEdit}
                    />
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-row gap-2">
                <div className="flex flex-col flex-1 min-w-[100px]">
                  <NumberInputField
                    label="কার্টুন"
                    min={0}
                    value={cartonQty}
                    onChange={(e) => setCartonQty(Number(e.target.value))}
                  />
                </div>

                <div className="flex flex-col flex-1 min-w-[100px]">
                  <NumberInputField
                    label="বক্স"
                    min={0}
                    max={getBoxInCarton() - 1}
                    value={boxQty}
                    onChange={(e) => setBoxQty(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex-1 min-w-[120px]">
                <PrimaryButton
                  type="button"
                  text="কার্টে যোগ"
                  onClick={handleAddToCart}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
