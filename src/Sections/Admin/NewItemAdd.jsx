import Heading from "@Components/Heading";
import PrimaryButton from "@Components/PrimaryButton";
import SecondaryButton from "@Components/SecondaryButton";
import InputField from "@Components/InputField";
import NumberInputField from "@Components/NumberInputField";

import { useNotification } from "@Context/NotificationContext";
import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@Configs/firebase";

export default function NewItemAdd() {
  const [loading, setLoading] = useState(false);
  const { notifySuccess, notifyError } = useNotification();

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [url, setUrl] = useState("");
  const [cost, setCost] = useState(0);
  const [sale, setSale] = useState(0);
  const [boxAmount, setBoxAmount] = useState(0);
  const [cartonAmount, setCartonAmount] = useState(0);
  const [boxInCarton, setBoxInCarton] = useState(0);

  const resetForm = () => {
    setName("");
    setSku("");
    setUrl("");
    setCost(0);
    setSale(0);
    setBoxAmount(0);
    setCartonAmount(0);
    setBoxInCarton(0);
  };

  const clearForm = () => {
    resetForm();
    notifySuccess("ক্লিয়ার করা হয়েছে")
  }

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
      notifyError("পণ্যের নাম ঠিকভাবে দিন");
      setLoading(false);
      return;
    }
    if (!skuTrim) {
      notifyError("পণ্যের SKU ঠিকভাবে দিন");
      setLoading(false);
      return;
    }
    if (isNaN(costNum) || costNum <= 0) {
      notifyError("ক্রয়মূল্য শূণ্য অপেক্ষা বেশি হতে হবে");
      setLoading(false);
      return;
    }
    if (isNaN(saleNum) || saleNum <= 0) {
      notifyError("বিক্রয়মূল্য শূণ্য অপেক্ষা বেশি হতে হবে");
      setLoading(false);
      return;
    }
    if (!Number.isInteger(boxInCartonNum) || boxInCartonNum <= 0) {
      notifyError("কার্টনে বক্সের পরিমাণ শূণ্য অপেক্ষা বেশি হতে হবে");
      setLoading(false);
      return;
    }
    if (isNaN(boxNum) || boxNum < 0 || isNaN(cartonNum) || cartonNum < 0) {
      notifyError("বক্স ও কার্টুন পরিমাণ শূণ্য অপেক্ষা বেশি হতে হবে");
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
      notifySuccess("নতুন পণ্য যোগ করা হয়েছে");
      resetForm();
    } catch (err) {
      console.error(err);
      notifyError("পন্য যোগ করা যায়নি। পুনরায় চেষ্টা করুন");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-[#0b1024] border-2 border-solid border-[#1f2937] rounded-2xl shadow-[0_6px_28px_rgba(0,0,0,.25)]">
      <Heading text="নতুন পণ্য" />
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2 p-3">
          <InputField
            label="নাম"
            id="itemName"
            placeholder="যেমন: A4 Paper"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex flex-row gap-2.5 pt-2">
            <InputField
              label="SKU"
              id="itemSku"
              placeholder="যেমন: SKU-001"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            />
            <NumberInputField
              label="কার্টনে বক্সের পরিমাণ"
              id="boxIncarton"
              min={1}
              value={boxInCarton}
              onChange={(e) => setBoxInCarton(e.target.value)}
            />
          </div>
          <InputField
            label="ছবির লিংক"
            id="itemImg"
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <div className="flex flex-row gap-2.5 pt-2">
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
              label="কার্টনের পরিমাণ"
              id="itemCartonAmount"
              min={0}
              value={cartonAmount}
              onChange={(e) => setCartonAmount(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <PrimaryButton
              type="submit"
              text={loading ? "যোগ করা হচ্ছে..." : "যোগ করুন"}
            />
            <SecondaryButton text="ক্লিয়ার" onClick={clearForm} />
          </div>
        </div>
      </form>
    </section>
  );
}

