import Heading from "../../Components/Heading";
import PrimaryButton from "../../Components/PrimaryButton";
import InputField from "../../Components/InputField";
import NumberInputField from "../../Components/NumberInputField";

import { useNotification } from "../../../Context/NotificationContext";
import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../../Config/firebase";

export default function NewItemAdd() {
  const [loading, setLoading] = useState(false);
  const { notifySuccess, notifyError } = useNotification();

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [url, setUrl] = useState("");
  const [cost, setCost] = useState("");
  const [sale, setSale] = useState("");
  const [boxAmount, setBoxAmount] = useState("0");
  const [cartonAmount, setCartonAmount] = useState("0");
  const [boxInCarton, setBoxInCarton] = useState("1");

  const resetForm = () => {
    setName("");
    setSku("");
    setUrl("");
    setCost("");
    setSale("");
    setBoxAmount("0");
    setCartonAmount("0");
    setBoxInCarton("1");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const nameTrim = (name || "").trim();
    const skuTrim = (sku || "").trim();
    const urlTrim = (url || "").trim();

    const costNum = Number(String(cost).replace(/,/g, "").trim());
    const saleNum = Number(String(sale).replace(/,/g, "").trim());
    const boxNum = parseInt(
      String(boxAmount).replace(/,/g, "").trim() || "0",
      10
    );
    const cartonNum = parseInt(
      String(cartonAmount).replace(/,/g, "").trim() || "0",
      10
    );
    const boxInCartonNum = parseInt(
      String(boxInCarton).replace(/,/g, "").trim() || "1",
      10
    );

    if (!nameTrim) {
      notifyError("নামের ফিল্ড পূরণ করুন।");
      setLoading(false);
      return;
    }
    if (!skuTrim) {
      notifyError("SKU দিন।");
      setLoading(false);
      return;
    }
    if (isNaN(costNum) || costNum <= 0) {
      notifyError("বৈধ ক্রয়মূল্য (বড়তর শূন্য) দিন।");
      setLoading(false);
      return;
    }
    if (isNaN(saleNum) || saleNum <= 0) {
      notifyError("বৈধ বিক্রয়মূল্য (বড়তর শূন্য) দিন।");
      setLoading(false);
      return;
    }
    if (!Number.isInteger(boxInCartonNum) || boxInCartonNum <= 0) {
      notifyError("কার্টুনে বক্স পছন্দসই সংখ্যাটি (কমপক্ষে 1) দিন।");
      setLoading(false);
      return;
    }
    if (isNaN(boxNum) || boxNum < 0 || isNaN(cartonNum) || cartonNum < 0) {
      notifyError(
        "বক্স ও কার্টুন পরিমাণ অবশ্যই 0 বা ধনাত্মক পূর্ণসংখ্যা হতে হবে।"
      );
      setLoading(false);
      return;
    }

    const totalBoxes = cartonNum * boxInCartonNum + boxNum;
    const normalizedCartons = Math.floor(totalBoxes / boxInCartonNum);
    const normalizedBoxes = totalBoxes % boxInCartonNum;

    const payload = {
      name: nameTrim,
      sku: skuTrim,
      image: urlTrim || null,
      pur_price: costNum,
      price: saleNum,

      initial: {
        submittedCartons: cartonNum,
        submittedBoxes: boxNum,
      },

      inventory: {
        cartons: normalizedCartons,
        boxes: normalizedBoxes,
        totalBoxes,
      },

      boxInCarton: boxInCartonNum,
      createdAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, "products"), payload);
      notifySuccess("Product added successfully!");
      resetForm();
    } catch (err) {
      console.error(err);
      notifyError("Failed to add product. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-[#0b1024] border-2 border-solid border-[#1f2937] rounded-2xl shadow-[0_6px_28px_rgba(0,0,0,.25)]">
      <Heading text="🧱 নতুন আইটেম" />
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2 p-3">
          <InputField
            label="নাম"
            id="itemName"
            placeholder="যেমন: A4 Paper"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex flex-row gap-2.5">
            <InputField
              label="SKU"
              id="itemSku"
              placeholder="যেমন: SKU-001"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            />
            <NumberInputField
              label="কার্টুনে বক্সের পরিমাণ"
              id="boxIncarton"
              min={1}
              value={boxInCarton}
              onChange={(e) => setBoxInCarton(e.target.value)}
            />
          </div>
          <InputField
            label="ছবির URL"
            id="itemImg"
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <div className="flex flex-row gap-2.5">
            <NumberInputField
              label="ক্রয়মূল্য"
              id="itemCost"
              min={1}
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
            <NumberInputField
              label="বিক্রয়মূল্য"
              id="itemSale"
              min={1}
              value={sale}
              onChange={(e) => setSale(e.target.value)}
            />
          </div>
          <div className="flex flex-row gap-2.5">
            <NumberInputField
              label="বক্সের পরিমাণ"
              id="itemBoxAmount"
              min={0}
              value={boxAmount}
              onChange={(e) => setBoxAmount(e.target.value)}
            />
            <NumberInputField
              label="কার্টুনের পরিমাণ"
              id="itemCartonAmount"
              min={0}
              value={cartonAmount}
              onChange={(e) => setCartonAmount(e.target.value)}
            />
          </div>
          <PrimaryButton type="submit" text={loading ? "Adding..." : "সেভ"} />
        </div>
      </form>
    </section>
  );
}
