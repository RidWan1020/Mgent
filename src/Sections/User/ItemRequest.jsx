import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../Config/firebase";
import { useAuth } from "../../../Context/AuthContext";
import { useNotification } from "../../../Context/NotificationContext";

import Heading from "../../Components/Heading";
import PrimaryButton from "../../Components/PrimaryButton";
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
      notifyError("Name is required.");
      setLoading(false);
      return;
    } else if (itemName.length < 3) {
      notifyError("Name must be at least 3 characters.");
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
      notifySuccess("Request Submitted successfully!");
      e.target.reset();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-[#0b1024] border-2 border-solid border-[#1f2937] rounded-2xl shadow-[0_6px_28px_rgba(0,0,0,.25)]">
      <Heading text="📨 আইটেম রিকোয়েস্ট" />
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2 p-3">
          <Inputfield
            label="প্রোডাক্ট নাম"
            id="reqTitle"
            placeholder="যেমন: iPhone 17 Pro Max"
          />
          <Inputfield
            label="বিবরণ"
            id="reqDesc"
            placeholder="একটি মোবাইল ফোন"
          />
          <PrimaryButton
            type="submit"
            text={loading ? "Sending..." : "রিকোয়েস্ট পাঠান"}
          />
        </div>
      </form>
    </section>
  );
}
