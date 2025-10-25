import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useEffect, useState, useRef, useMemo } from "react";
import { db } from "@Configs/firebase";
import { useAuth } from "@Context/AuthContext";
import { useNotification } from "@Context/NotificationContext";

import Heading from "@Components/Heading";
import MemoPDF from "@Components/MemoPDF";
import AccordionItem from "@Components/AccordionItem";
import PrimaryButton from "@Components/PrimaryButton";
import SecondaryButton from "@Components/SecondaryButton";
import InputField from "@Components/InputField";
import SelectInput from "@Components/SelectInput";

const fmt = (n) =>
  !Number.isFinite(n) ? "0.00" : (Math.round(n * 100) / 100).toFixed(2);

export default function MemoCatalog() {
  const { user } = useAuth();
  const [memos, setMemos] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState({});

  const { notifySuccess, notifyError } = useNotification();

  const memoRefs = useRef({});

  const [filterBy, setFilterBy] = useState("সবকিছু");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user || !user.uid) {
        if (mounted) setIsAdmin(false);
        return;
      }
      try {
        const uDoc = await getDoc(doc(db, "users", user.uid));
        if (!mounted) return;
        const role = uDoc.exists() ? uDoc.data()?.role : null;
        setIsAdmin(String(role).toLowerCase() === "admin" || role === "Admin");
      } catch (err) {
        console.error("Failed to read user role:", err);
        if (mounted) setIsAdmin(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    setLoading(true);

    const q = query(collection(db, "memos"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        if (!user || !user.uid) {
          setMemos([]);
          setLoading(false);
          return;
        }
        if (isAdmin) {
          setMemos(arr);
          setLoading(false);
          return;
        }

        const uid = user.uid;
        const filtered = arr.filter((m) => {
          return (
            m.user === uid ||
            m.userId === uid ||
            m.createdBy === uid ||
            (user.email &&
              String(m.userEmail || m.userEmailAddress || "")
                .toLowerCase()
                .trim() === String(user.email).toLowerCase().trim()) ||
            (user.phoneNumber &&
              String(m.userPhone || m.phone || "").includes(user.phoneNumber))
          );
        });

        setMemos(filtered);
        setLoading(false);
      },
      (err) => {
        console.error("memos onSnapshot error:", err);
        setMemos([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user, isAdmin]);

  const normalizedQuery = (searchQuery || "").toLowerCase().trim();

  const matchesUser = (memo, q) => {
    if (!q) return true;
    const fields = [
      memo.userName,
      memo.user,
      memo.userEmail,
      memo.userEmailAddress,
      memo.userPhone,
      memo.phone,
      memo.id,
    ];
    return fields.some((f) =>
      String(f || "")
        .toLowerCase()
        .includes(q)
    );
  };

  const matchesItem = (memo, q) => {
    if (!q) return true;
    const items = Array.isArray(memo.items) ? memo.items : [];
    return items.some((it) => {
      const fields = [it.name, it.productId, it.sku, it.code, it.variant];
      return fields.some((f) =>
        String(f || "")
          .toLowerCase()
          .includes(q)
      );
    });
  };

  const filteredMemos = useMemo(() => {
    if (!normalizedQuery) return memos;
    return memos.filter((memo) => {
      if (filterBy === "ব্যবহারকারী") {
        return matchesUser(memo, normalizedQuery);
      }
      if (filterBy === "পণ্য") {
        return matchesItem(memo, normalizedQuery);
      }
      return (
        matchesUser(memo, normalizedQuery) || matchesItem(memo, normalizedQuery)
      );
    });
  }, [memos, filterBy, normalizedQuery]);

  const clearSearch = () => {
    setFilterBy("সবকিছু");
    setSearchQuery("");
  };

  const handleDownload = async (memo) => {
    try {
      const element = memoRefs.current[memo.id];
      if (!element) {
        console.warn("No memo element to capture for", memo.id);
        return;
      }

      await new Promise((r) => setTimeout(r, 50));

      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`memo-${memo.id}.pdf`);
    } catch (err) {
      console.error("handleDownload error:", err);
    }
  };

  const handleEditMemo = async (memo) => {
    if (!memo?.id) {
      notifyError("ইডিট করা যাচ্ছে না — মেমো আইডি পাওয়া যায়নি");
      return;
    }

    if (!user || !user.uid) {
      notifyError("প্রথমে লগিন করুন");
      return;
    }

    try {
      // check existing cart for this user
      const cartRef = doc(db, "carts", user.uid);
      const cartSnap = await getDoc(cartRef);

      if (cartSnap.exists()) {
        const cartData = cartSnap.data() || {};
        const existingItems = Array.isArray(cartData.items)
          ? cartData.items
          : [];
        if (existingItems.length > 0) {
          notifyError("কার্টে ইতিমধ্যে আইটেম আছে — আগে কার্ট খালি করুন");
          return; // reject as required
        }
      }

      // Map memo.items -> cart item shape (adjust fields to match your cart schema)
      // Keep the fields you need in the cart. Example mapping:
      const itemsForCart = (Array.isArray(memo.items) ? memo.items : []).map(
        (it) => ({
          productId: it.productId ?? it.id ?? null,
          name: it.name ?? "",
          sku: it.sku ?? it.code ?? null,
          boxInCarton: Number(it.boxInCarton ?? it.cartoonAmount ?? 1),
          totalBoxes: Number(it.totalBoxes ?? it.qty ?? 0),
          unitPrice: Number(it.unitPrice ?? it.price ?? 0),
          discount: Number(it.discount ?? 0),
          // optionally keep any other meta you need
        })
      );

      if (itemsForCart.length === 0) {
        notifyError("এই মেমোতে কোনো আইটেম নেই");
        return;
      }

      // create/set cart doc for user (empty or new). we merge to be safe.
      await setDoc(
        cartRef,
        {
          items: itemsForCart,
          createdFromMemo: memo.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // delete the memo after creating cart
      await deleteDoc(doc(db, "memos", memo.id));

      notifySuccess("মেমোটি কার্টে পাঠানো হয়েছে — এখন আপনি এডিট করতে পারবেন");
    } catch (err) {
      console.error("handleEditMemo error:", err);
      // detect permission error or other problems
      if (err?.code === "permission-denied") {
        notifyError("আপনার কাছে অনুুমতি নেই (permission-denied)");
      } else {
        notifyError("মেমো কার্টে পাঠানো যায়নি — কনসোলে ত্রুটি দেখুন");
      }
    }
  };

  const handleDeleteMemo = async (memo) => {
    const ok = window.confirm("আপনি কি নিশ্চিত যে এটি ডিলিট করতে চান?");
    if (!ok) return;

    if (!memo?.id) {
      console.error("Invalid memo, missing id:", memo);
      notifyError("ডিলিট করা যায়নি, আইডি পাওয়া যায়নি");
      return;
    }

    try {
      await deleteDoc(doc(db, "memos", memo.id));
      notifySuccess("মেমো ডিলিট করা হয়েছে");
    } catch (err) {
      console.error("Delete failed:", err);
      notifyError("মেমো ডিলিট করা যায়নি");
    }
  };

  const convertToBengaliNumerals = (str) => {
    const bengaliNumerals = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(str).replace(/[0-9]/g, (match) => bengaliNumerals[match]);
  };

  const getBengaliTimePeriod = (hour24) => {
    if (hour24 >= 12 && hour24 <= 15) {
      return "দুপুর";
    } else if (hour24 >= 16 && hour24 <= 17) {
      return "বিকাল";
    } else if (hour24 >= 20 || hour24 <= 3) {
      return "রাত";
    } else if (hour24 >= 18 && hour24 <= 19) {
      return "সন্ধ্যা";
    } else if (hour24 >= 4 && hour24 <= 5) {
      return "ভোর";
    } else if (hour24 >= 6 && hour24 <= 11) {
      return "সকাল";
    }
    return "";
  };

  const parseWhen = (ts) => {
    if (!ts) return "";
    let date;

    if (ts?.toDate) {
      date = ts.toDate();
    } else if (ts?.seconds) {
      date = new Date(ts.seconds * 1000);
    } else if (typeof ts === "number") {
      date = new Date(ts);
    } else {
      return String(ts);
    }

    const hour24 = date.getHours();

    let hour12 = hour24 % 12;
    if (hour12 === 0) {
      hour12 = 12;
    }

    const minute = date.getMinutes();
    const datePart = date.toLocaleDateString("bn-BD", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const customTimePeriod = getBengaliTimePeriod(hour24);
    const bengaliHour = convertToBengaliNumerals(hour12);
    const bengaliMinute = convertToBengaliNumerals(
      minute.toString().padStart(2, "0")
    );

    return `${datePart}, ${customTimePeriod} ${bengaliHour}:${bengaliMinute}`;
  };

  const calcMemoTotals = (memo) => {
    const items = Array.isArray(memo.items) ? memo.items : [];
    let subtotal = 0;
    let discountSum = 0;
    items.forEach((it) => {
      const unitPrice = Number(it.unitPrice ?? it.price ?? 0);
      const totalBoxes = Number(it.totalBoxes ?? it.qty ?? 0);
      const discount = Number(it.discount ?? 0);
      const lineBefore = unitPrice * totalBoxes;
      subtotal += lineBefore;
      discountSum += Math.max(0, discount);
    });
    const total = Math.max(0, subtotal - discountSum);
    return { subtotal, discountSum, total };
  };

  const handleStatusChange = async (memoId, newStatus) => {
    setStatusUpdating((s) => ({ ...s, [memoId]: true }));
    try {
      await updateDoc(doc(db, "memos", memoId), { status: newStatus });
    } catch (err) {
      console.error("Failed to update memo status:", err);
    } finally {
      setStatusUpdating((s) => {
        const copy = { ...s };
        delete copy[memoId];
        return copy;
      });
    }
  };

  return (
    <section className="bg-[#0b1024] border-2 border-solid border-[#1f2937] rounded-2xl shadow-[0_6px_28px_rgba(0,0,0,.25)]">
      <Heading text="📚 ক্যাশ মেমোর তালিকা" />
      <div className="px-2.5 py-3">
        <div className="flex md:items-center p-3 gap-3">
          <SelectInput
            id="filterBy"
            placeholder="ফিল্টার"
            value={filterBy}
            options={["সবকিছু", "ব্যবহারকারী", "পণ্য"]}
            onChange={(e) => setFilterBy(e.target.value)}
          />
          <InputField
            id="searchRequests"
            placeholder={
              filterBy === "ব্যবহারকারী"
                ? "ব্যবহারকারী খুঁজুন"
                : filterBy === "পণ্য"
                ? "পণ্য খুঁজুন"
                : "খুঁজুন"
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <SecondaryButton type="button" text="ক্লিয়ার" onClick={clearSearch} />
        </div>

        {loading ? (
          <div className="text-sm text-[#94a3b8] px-3 py-2">লোড হচ্ছে...</div>
        ) : filteredMemos.length === 0 ? (
          <div className="text-sm text-[#94a3b8] px-3 py-2 text-center">
            কোনো ক্যাশ মেমো নেই
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto px-3">
            {filteredMemos.map((memo) => {
              const totals = calcMemoTotals(memo);
              const when = parseWhen(memo.createdAt);
              const subtitle = `${memo.userName || memo.user || "Unknown"}`;
              const header = when.toLocaleString("bn-BD");
              const status = memo.status ?? "pending";

              return (
                <AccordionItem
                  key={memo.id}
                  id={`memo-${memo.id}`}
                  title={header}
                  subtitle={subtitle}
                  isOpen={openId === memo.id}
                  onToggle={() =>
                    setOpenId(openId === memo.id ? null : memo.id)
                  }
                >
                  <div className="mb-3">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-xs text-[#94a3b8]">Status:</div>
                      <div
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          status === "accepted"
                            ? "bg-green-700 text-green-100"
                            : status === "rejected"
                            ? "bg-red-700 text-red-100"
                            : "bg-yellow-700 text-yellow-100"
                        }`}
                      >
                        {status}
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        <PrimaryButton
                          text="ডাউনলোড"
                          onClick={() => handleDownload(memo)}
                        />
                        {isAdmin && status === "pending" && (
                          <div className="ml-auto flex items-center gap-2">
                            <SelectInput
                              id={`status-${memo.id}`}
                              value={status}
                              onChange={(e) =>
                                handleStatusChange(memo.id, e.target.value)
                              }
                              options={["pending", "accepted", "rejected"]}
                              placeholder="Status"
                            />

                            <div className="text-xs text-[#94a3b8]">
                              {statusUpdating[memo.id] ? "Updating..." : ""}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {Array.isArray(memo.items) && memo.items.length > 0 ? (
                        memo.items.map((it) => {
                          const boxInCarton =
                            Number(it.boxInCarton ?? it.cartoonAmount ?? 1) ||
                            1;
                          const totalBoxes =
                            Number(it.totalBoxes ?? it.qty ?? 0) || 0;
                          const cartons = Math.floor(totalBoxes / boxInCarton);
                          const boxes = totalBoxes % boxInCarton;
                          const unitPrice = Number(
                            it.unitPrice ?? it.price ?? 0
                          );
                          const discount = Number(it.discount ?? 0);
                          const lineBefore = unitPrice * totalBoxes;
                          const lineAfter = Math.max(
                            0,
                            lineBefore - Math.max(0, discount)
                          );

                          return (
                            <div
                              key={it.productId ?? it.name}
                              className="flex items-start gap-3 p-3 border border-[#1f2937] rounded-xl bg-[#071225]"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-[#e6eef6] truncate">
                                  {it.name}
                                </div>
                                <div className="mt-1 text-xs text-[#94a3b8]">
                                  পরিমাণ:{" "}
                                  <span className="text-[#cfeefb]">
                                    {cartons.toLocaleString("bn-BD")} কার্টুন{" "}
                                    {boxes.toLocaleString("bn-BD")} বক্স
                                  </span>
                                </div>
                                <div className="mt-1 text-xs text-[#94a3b8] flex flex-wrap gap-2">
                                  <div>
                                    প্রতি বক্স:{" "}
                                    {Number(fmt(unitPrice)).toLocaleString(
                                      "bn-BD"
                                    )}{" "}
                                    টাকা
                                  </div>
                                  {discount > 0 && (
                                    <div>
                                      ডিসকাউন্ট:{" "}
                                      {Number(fmt(discount)).toLocaleString(
                                        "bn-BD"
                                      )}{" "}
                                      টাকা
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="hidden sm:flex sm:flex-col sm:items-end sm:justify-between">
                                <div className="text-sm font-semibold text-green-400 whitespace-nowrap">
                                  {Number(fmt(lineAfter)).toLocaleString(
                                    "bn-BD"
                                  )}{" "}
                                  টাকা
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-sm text-[#94a3b8] px-2 py-2">
                          No items in this memo
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 mt-2">
                        <div
                          ref={(el) => {
                            if (el) memoRefs.current[memo.id] = el;
                            else delete memoRefs.current[memo.id];
                          }}
                          style={{
                            position: "absolute",
                            left: -9999,
                            top: 0,
                            width: "210mm",
                            background: "white",
                            padding: "16px",
                            color: "#000",
                          }}
                        >
                          <MemoPDF
                            memo={memo}
                            calcMemoTotals={calcMemoTotals}
                            parseWhen={parseWhen}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          {status === "pending" && (
                            <PrimaryButton
                              text="ইডিট"
                              onClick={() => handleEditMemo(memo)}
                            />
                          )}
                          <SecondaryButton
                            text="ডিলিট"
                            onClick={() => handleDeleteMemo(memo)}
                          />
                        </div>
                        <div className="mt-2 px-2 py-2 rounded bg-[#061227] border border-[#1f2937] text-sm text-[#93c5fd]">
                          মোট:{" "}
                          <span className="font-semibold text-green-300">
                            {Number(fmt(totals.total)).toLocaleString("bn-BD")}{" "}
                            টাকা
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionItem>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
