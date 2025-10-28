import { useEffect, useState } from "react";
import {
  collection,
  query,
  onSnapshot,
  where,
} from "firebase/firestore";
import { db } from "@Configs/firebase";
import Heading from "@Components/Heading";

const fmtNumber = (n) => {
  if (!Number.isFinite(n)) return "0.00";
  return (Math.round(n * 100) / 100).toFixed(2);
};

export default function Finance() {
  const [importTotal, setImportTotal] = useState(0);
  const [salesTotal, setSalesTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const unsubProducts = onSnapshot(
      collection(db, "products"),
      (snap) => {
        let sum = 0;
        snap.docs.forEach((d) => {
          const p = d.data() || {};
          const boxInCarton = Number(p.boxInCarton ?? p.cartoonAmount ?? 1) || 1;
          const totalBoxesFromInventory =
            Number(p.inventory?.totalBoxes ?? NaN);
          let totalBoxes = Number.isFinite(totalBoxesFromInventory)
            ? totalBoxesFromInventory
            : typeof p.stock === "number"
            ? p.stock
            : NaN;

          if (!Number.isFinite(totalBoxes)) {
            const invCartons = Number(p.inventory?.cartons ?? NaN);
            const invBoxes = Number(p.inventory?.boxes ?? NaN);
            if (Number.isFinite(invCartons) && Number.isFinite(invBoxes)) {
              totalBoxes = invCartons * boxInCarton + invBoxes;
            } else {
              totalBoxes = 0;
            }
          }

          const purPrice = Number(p.pur_price ?? p.purPrice ?? p.purchasePrice ?? 0) || 0;
          const productTotal = totalBoxes * purPrice;
          sum += productTotal;
        });

        setImportTotal(sum);
        setLoading(false);
      },
      (err) => {
        console.error("products snapshot error", err);
        setImportTotal(0);
        setLoading(false);
      }
    );

    const q = query(collection(db, "memos"), where("status", "==", "accepted"));
    const unsubMemos = onSnapshot(
      q,
      (snap) => {
        let sum = 0;
        snap.docs.forEach((d) => {
          const m = d.data() || {};
          const g = Number(m.totals?.grandTotal ?? m.totals?.total ?? NaN);
          if (Number.isFinite(g)) {
            sum += g;
            return;
          }

          const items = Array.isArray(m.items) ? m.items : [];
          let localSum = 0;
          items.forEach((it) => {
            const unitPrice = Number(it.unitPrice ?? it.price ?? 0) || 0;
            const qty = Number(it.totalBoxes ?? it.qty ?? 0) || 0;
            const discount = Number(it.discount ?? 0) || 0;
            const lineBefore = unitPrice * qty;
            const lineAfter = Math.max(0, lineBefore - Math.max(0, discount));
            localSum += lineAfter;
          });
          sum += localSum;
        });

        setSalesTotal(sum);
      },
      (err) => {
        console.error("memos snapshot error", err);
        setSalesTotal(0);
      }
    );

    return () => {
      unsubProducts();
      unsubMemos();
    };
  }, []);

  const profit = salesTotal - importTotal;

  return (
    <section className="bg-[#0b1024] border-2 border-solid border-[#1f2937] rounded-2xl shadow-[0_6px_28px_rgba(0,0,0,.25)] p-6">
      <Heading text="মোট হিসাব" />

      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left text-[#e6eef6] border-collapse">
          <thead className="bg-[#1f2937] text-[#20c4dd]">
            <tr>
              <th className="p-3 border-b border-[#2d3c56] text-center">ইম্পোর্ট</th>
              <th className="p-3 border-b border-[#2d3c56] text-center">বিক্রয়</th>
              <th className="p-3 border-b border-[#2d3c56] text-center">আয়</th>
            </tr>
          </thead>

          <tbody>
            <tr className="hover:bg-[#111a33] transition-colors">
              <td className="p-3 border-b border-[#1f2937] text-center">
                ৳ {Number(fmtNumber(importTotal)).toLocaleString("bn-BD")}
              </td>

              <td className="p-3 border-b border-[#1f2937] text-center">
                ৳ {Number(fmtNumber(salesTotal)).toLocaleString("bn-BD")}
              </td>

              <td className={`p-3 border-b border-[#1f2937] text-center ${profit < 0 ? "text-red-400" : "text-green-400"}`}>
                ৳ {Number(fmtNumber(profit)).toLocaleString("bn-BD")}
              </td>
            </tr>

            {loading && (
              <tr>
                <td colSpan="3" className="text-center text-[#94a3b8] p-4">
                  লোড হচ্ছে...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}