import React, { forwardRef } from "react";

const fmt = (n) => (!Number.isFinite(n) ? "0.00" : (Math.round(n * 100) / 100).toFixed(2));

const MemoPDF = forwardRef(({ memo, calcMemoTotals, parseWhen }, ref) => {
  const totals = calcMemoTotals(memo);
  return (
    <div ref={ref} className="p-5 bg-white text-black w-[210mm]">
      <h2 className="text-xl font-bold mb-3">Memo</h2>
      <p>{parseWhen(memo.createdAt)}</p>
      <p>User: {memo.userName || memo.user}</p>

      <table className="w-full border-collapse mt-3">
        <thead>
          <tr>
            <th className="border p-2">পণ্য</th>
            <th className="border p-2">পরিমাণ</th>
            <th className="border p-2">ইউনিটের মূল্য</th>
            <th className="border p-2">ডিসকাউন্ট</th>
            <th className="border p-2">মোট</th>
          </tr>
        </thead>
        <tbody>
          {memo.items.map((it) => {
            const totalBoxes = Number(it.totalBoxes ?? it.qty ?? 0);
            const unitPrice = Number(it.unitPrice ?? it.price ?? 0);
            const discount = Number(it.discount ?? 0);
            const lineAfter = Math.max(0, unitPrice * totalBoxes - discount);

            return (
              <tr key={it.productId ?? it.name}>
                <td className="border p-2">{it.name}</td>
                <td className="border p-2">{totalBoxes.toLocaleString("bn-BD")}</td>
                <td className="border p-2">{(Number(fmt(unitPrice))).toLocaleString("bn-BD")}</td>
                <td className="border p-2">{(Number(fmt(discount))).toLocaleString("bn-BD")}</td>
                <td className="border p-2">{(Number(fmt(lineAfter))).toLocaleString("bn-BD")}</td>
              </tr>
            );
          })}
          <tr>
            <td colSpan={4} className="text-right font-semibold p-2">Total:</td>
            <td className="font-semibold p-2">৳{fmt(totals.total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
});

export default MemoPDF;