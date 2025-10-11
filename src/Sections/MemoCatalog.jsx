import { useEffect, useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../Config/firebase";
import Header from "../Components/Heading";
import MemoPDF from "../Components/MemoPDF";
import AccordionItem from "../Components/AccordionItem";
import PrimaryButton from "../Components/PrimaryButton";
import { useAuth } from "../../Context/AuthContext";

const fmt = (n) =>
  !Number.isFinite(n) ? "0.00" : (Math.round(n * 100) / 100).toFixed(2);

export default function MemoCatalog() {
  const { user } = useAuth();
  const [memos, setMemos] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState({}); // { memoId: true }

  const memoRefs = useRef({});

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
              String(m.userEmail || m.userEmailAddress || "").toLowerCase() ===
                String(user.email).toLowerCase()) ||
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

  const parseWhen = (ts) => {
    if (!ts) return "";
    if (ts?.toDate) return ts.toDate().toLocaleString();
    if (ts?.seconds) return new Date(ts.seconds * 1000).toLocaleString();
    if (typeof ts === "number") return new Date(ts).toLocaleString();
    return String(ts);
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
      <Header text="📚 মেমো ক্যাটালগ" />
      <div className="px-2.5 py-3">
        {loading ? (
          <div className="text-sm text-[#94a3b8] px-3 py-2">লোড হচ্ছে...</div>
        ) : memos.length === 0 ? (
          <div className="text-sm text-[#94a3b8] px-3 py-2 text-center">
            কোনো মেমো নেই
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {memos.map((memo) => {
              const totals = calcMemoTotals(memo);
              const when = parseWhen(memo.createdAt);
              const subtitle = `${memo.userName || memo.user || "Unknown"} • ৳${fmt(
                totals.total
              )}`;
              const header = when;
              const status = memo.status ?? "pending";

              return (
                <AccordionItem
                  key={memo.id}
                  id={`memo-${memo.id}`}
                  title={header}
                  subtitle={subtitle}
                  isOpen={openId === memo.id}
                  onToggle={() => setOpenId(openId === memo.id ? null : memo.id)}
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

                      {isAdmin && (
                        <div className="ml-auto flex items-center gap-2">
                          <select
                            value={status}
                            onChange={(e) =>
                              handleStatusChange(memo.id, e.target.value)
                            }
                            className="bg-[#071225] border border-[#1f2937] px-2 py-1 rounded text-sm"
                            disabled={!!statusUpdating[memo.id]}
                          >
                            <option value="pending">pending</option>
                            <option value="accepted">accepted</option>
                            <option value="rejected">rejected</option>
                          </select>
                          <div className="text-xs text-[#94a3b8]">
                            {statusUpdating[memo.id] ? "Updating..." : ""}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* items list */}
                    <div className="space-y-3">
                      {Array.isArray(memo.items) && memo.items.length > 0 ? (
                        memo.items.map((it) => {
                          const boxInCarton =
                            Number(it.boxInCarton ?? it.cartoonAmount ?? 1) || 1;
                          const totalBoxes = Number(it.totalBoxes ?? it.qty ?? 0) || 0;
                          const cartons = Math.floor(totalBoxes / boxInCarton);
                          const boxes = totalBoxes % boxInCarton;
                          const unitPrice = Number(it.unitPrice ?? it.price ?? 0);
                          const discount = Number(it.discount ?? 0);
                          const lineBefore = unitPrice * totalBoxes;
                          const lineAfter = Math.max(0, lineBefore - Math.max(0, discount));

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
                                    {cartons} কার্টুন {boxes} বক্স
                                  </span>
                                </div>
                                <div className="mt-1 text-xs text-[#94a3b8] flex flex-wrap gap-2">
                                  <div>প্রতি বক্স: ৳{fmt(unitPrice)}</div>
                                  {discount > 0 && <div>ডিসকাউন্ট: ৳{fmt(discount)}</div>}
                                </div>
                              </div>

                              <div className="hidden sm:flex sm:flex-col sm:items-end sm:justify-between">
                                <div className="text-sm font-semibold text-green-400 whitespace-nowrap">
                                  ৳{fmt(lineAfter)}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-sm text-[#94a3b8] px-2 py-2">No items in this memo</div>
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
                          <MemoPDF memo={memo} calcMemoTotals={calcMemoTotals} parseWhen={parseWhen} />
                        </div>

                        <PrimaryButton text="Download PDF" onClick={() => handleDownload(memo)} />
                        <div className="mb-3 px-2 py-2 rounded bg-[#061227] border border-[#1f2937] text-sm text-[#93c5fd]">
                          মোট:{" "}
                          <span className="font-semibold text-green-300">৳{fmt(totals.total)}</span>
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
