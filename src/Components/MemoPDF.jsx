import React, { forwardRef } from "react";

const fmt = (n) => (!Number.isFinite(n) ? "0.00" : (Math.round(n * 100) / 100).toFixed(2));

const MemoPDF = forwardRef(({ memo, calcMemoTotals, parseWhen }, ref) => {
  const totals = calcMemoTotals(memo);
  return (
    <div ref={ref} className="p-5 bg-white text-black w-[210mm]">
      <h2 className="text-xl font-bold mb-3">Memo</h2>
      <p>Created: {parseWhen(memo.createdAt)}</p>
      <p>User: {memo.userName || memo.user}</p>

      <table className="w-full border-collapse mt-3">
        <thead>
          <tr>
            <th className="border p-2">Product</th>
            <th className="border p-2">Qty</th>
            <th className="border p-2">Unit Price</th>
            <th className="border p-2">Discount</th>
            <th className="border p-2">Total</th>
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
                <td className="border p-2">{totalBoxes}</td>
                <td className="border p-2">৳{fmt(unitPrice)}</td>
                <td className="border p-2">৳{fmt(discount)}</td>
                <td className="border p-2">৳{fmt(lineAfter)}</td>
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