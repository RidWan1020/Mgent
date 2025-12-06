import { useEffect, useState } from "react";
import { db } from "@Configs/firebase";
import { collection, getDocs } from "firebase/firestore";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import Heading from "@Components/Heading";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function UserDailySummary() {
  const [summary, setSummary] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    fetchTodayMemos();
  }, []);

  async function fetchTodayMemos() {
    const memosRef = collection(db, "memos");
    const snap = await getDocs(memosRef);

    const today = dayjs().tz("Asia/Dhaka");

    const todaysMemos = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((memo) => {
        if (memo.status === "accepted" || memo.status === "rejected")
          return false;
        const memoDate = dayjs(memo.createdAt.toDate()).tz("Asia/Dhaka");
        return memoDate.isSame(today, "day");
      });

    const combinedProducts = {};

    todaysMemos.forEach((memo) => {
      memo.items.forEach((item) => {
        const id = item.productId;
        const boxes = Number(item.boxes);
        const cartons = Number(item.cartons);
        const unitPrice = Number(item.unitPrice);

        if (!combinedProducts[id]) {
          combinedProducts[id] = {
            productId: id,
            name: item.name,
            boxes,
            cartons,
            unitPrice,
            total:
              boxes * unitPrice + cartons * unitPrice * (item.boxInCarton ?? 1),
          };
        } else {
          combinedProducts[id].boxes += boxes;
          combinedProducts[id].cartons += cartons;
          combinedProducts[id].total =
            combinedProducts[id].boxes * unitPrice +
            combinedProducts[id].cartons * unitPrice * (item.boxInCarton ?? 1);
        }
      });
    });

    const finalList = Object.values(combinedProducts);

    setSummary(finalList);

    const grand = finalList.reduce((sum, p) => sum + p.total, 0);
    setTotalAmount(grand);
  }

  return (
    <section className="bg-[#0b1024] border-2 border-solid border-[#1f2937] rounded-2xl shadow-[0_6px_28px_rgba(0,0,0,.25)] p-4">
      <Heading text="আজকের পণ্যের তালিকা" />

      {summary.length === 0 ? (
        <p className="text-gray-400 text-sm px-2 py-4">
          আজকে এখনো কোন পন্য কিনেনি।
        </p>
      ) : (
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-[#e6eef6] border-collapse">
            <thead className="bg-[#1f2937] text-[#20c4dd]">
              <tr>
                <th className="p-3 border-b border-[#2d3c56] text-center">
                  পণ্যের নাম
                </th>
                <th className="p-3 border-b border-[#2d3c56] text-center">
                  বক্সের পরিমাণ
                </th>
                <th className="p-3 border-b border-[#2d3c56] text-center">
                  কার্টনের পরিমাণ
                </th>
                <th className="p-3 border-b border-[#2d3c56] text-center">
                  মোট
                </th>
              </tr>
            </thead>
            <tbody>
              {summary.map((p) => (
                <tr className="hover:bg-[#111a33] transition-colors">
                  <td className="p-3 border-b border-[#1f2937] text-center">
                    {p.name}
                  </td>
                  <td className="p-3 border-b border-[#1f2937] text-center">
                    {p.boxes.toLocaleString("bn-BD")}
                  </td>
                  <td className="p-3 border-b border-[#1f2937] text-center">
                    {p.cartons.toLocaleString("bn-BD")}
                  </td>
                  <td className="p-3 border-b border-[#1f2937] text-center">
                    {p.total.toLocaleString("bn-BD")} টাকা
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 mt-2">
        <div className="mt-2 px-2 py-2 rounded bg-[#061227] border border-[#1f2937] text-sm text-[#93c5fd]">
          মোট:{" "}
          <span className="font-semibold text-green-300">
            {totalAmount.toLocaleString("bn-BD")} টাকা
          </span>
        </div>
      </div>
    </section>
  );
}
