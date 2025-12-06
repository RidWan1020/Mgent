import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@Configs/firebase";
import { useAuth } from "@Context/AuthContext";

import Heading from "@Components/Heading";
import NumberInputField from "@Components/NumberInputField";

export default function UserEarnings() {
  const { user } = useAuth();
  const [salesTotal, setSalesTotal] = useState(0);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "memos"),
      where("status", "==", "accepted"),
      where("userId", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      let sum = 0;

      snap.docs.forEach((d) => {
        const m = d.data();

        const directTotal = Number(m?.totals?.grandTotal ?? NaN);

        if (Number.isFinite(directTotal)) {
          sum += directTotal;
        } else {
          const items = m.items || [];
          let local = 0;
          items.forEach((it) => {
            const unit = Number(it.unitPrice ?? 0);
            const qty = Number(it.totalBoxes ?? 0);
            const disc = Number(it.discount ?? 0);
            local += Math.max(0, unit * qty - disc);
          });
          sum += local;
        }
      });

      setSalesTotal(sum);
    });

    return () => unsub();
  }, [user?.uid]);

  const handlePercent = (e) => {
    const val = Number(e.target.value);
    if (val >= 1 && val <= 50) {
      setPercent(val);
    }
  };

  const result = (salesTotal * percent) / 100;

  return (
    <section className="bg-[#0b1024] border-2 border-solid border-[#1f2937] rounded-2xl shadow-[0_6px_28px_rgba(0,0,0,.25)] p-4">
      <Heading text="আপনার বিক্রয় হিসাব" />

      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left text-[#e6eef6] border-collapse">
          <thead className="bg-[#1f2937] text-[#20c4dd]">
            <tr>
              <th className="p-3 border-b border-[#2d3c56] text-center">
                মোট
              </th>
              <th className="p-3 border-b border-[#2d3c56] text-center">
                শতাংশের হিসাব (১% - ৫০%)
              </th>
            </tr>
          </thead>

          <tbody>
            <tr className="hover:bg-[#111a33] transition-colors">
              <td className="p-3 border-b border-[#1f2937] text-center">
                ৳ {salesTotal.toLocaleString("bn-BD")}
              </td>

              <td className="p-3 border-b border-[#1f2937] text-center">
                <div className="flex items-center justify-center gap-4">
                  ৳ {result.toLocaleString("bn-BD")}
                  <NumberInputField
                    min="1"
                    max="50"
                    value={percent}
                    onChange={handlePercent}
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
