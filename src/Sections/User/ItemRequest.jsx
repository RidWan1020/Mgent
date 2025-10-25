import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../Configs/firebase";
import { useAuth } from "../../Context/AuthContext";
import { useNotification } from "../../Context/NotificationContext";

import Heading from "../../Components/Heading";
import PrimaryButton from "../../Components/PrimaryButton";
import SecondaryButton from "../../Components/SecondaryButton";
import Inputfield from "../../Components/InputField";

export default function ItemRequest() {
  const [loading, setLoading] = useState(false);
  const { notifySuccess, notifyError } = useNotification();

  const { user, name } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const itemName = e.target.reqTitle.value;
    const explanation = e.target.reqDesc.value;

    if (!itemName) {
      notifyError("পণ্যের নাম দিন");
      setLoading(false);
      return;
    } else if (itemName.length < 3) {
      notifyError("নামের দৈর্ঘ্য ন্যূনতম ৩ অক্ষরের হতে হবে");
      setLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, "itemRequest"), {
        name: itemName,
        explanation,
        userId: user?.uid || null,
        requestedBy: name || "Guest",
        createdAt: serverTimestamp(),
      });
      notifySuccess("আপনার রিকোয়েস্ট সাবমিট হয়েছে");
      e.target.reset();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    const form = document.getElementById("reqForm");
    if (form) {
      form.reset();
      notifySuccess("ক্লিয়ার করা হয়েছে।")
    }
  };

  return (
    <section className="bg-[#0b1024] border-2 border-solid border-[#1f2937] rounded-2xl shadow-[0_6px_28px_rgba(0,0,0,.25)]">
      <Heading text="📨 আইটেম রিকোয়েস্ট" />
      <form id="reqForm" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2 p-3">
          <Inputfield
            label="পণ্যের নাম"
            id="reqTitle"
            placeholder="যেমন: iPhone 17 Pro Max"
          />
          <Inputfield
            label="পণ্যের বিবরণ"
            id="reqDesc"
            placeholder="একটি মোবাইল ফোন"
          />
          <div className="flex items-center justify-center gap-2 pt-2">
            <PrimaryButton
              type="submit"
              text={loading ? "Sending..." : "রিকোয়েস্ট পাঠান"}
            />
            <SecondaryButton text="ক্লিয়ার" onClick={clearForm} />
          </div>
        </div>
      </form>
    </section>
  );
}
