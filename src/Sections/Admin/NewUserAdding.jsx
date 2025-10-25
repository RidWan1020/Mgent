import { useState, useRef } from "react";
import { useNotification } from "@Context/NotificationContext";

import Heading from "@Components/Heading";
import PrimaryButton from "@Components/PrimaryButton";
import SecondaryButton from "@Components/SecondaryButton";
import InputField from "@Components/InputField";
import SelectInput from "@Components/SelectInput";

import { db, secondaryAuth } from "@Configs/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function NewUserAdding() {
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);
  const { notifySuccess, notifyError } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const name = e.target.newUserName.value;
    const phone = e.target.newUserPhone.value;
    const password = e.target.newUserPassword.value;
    const role = e.target.newUserRole.value;

    if (!name || !phone || !password) {
      notifyError("সকল তথ্য সঠিকভাবে দিন");
      setLoading(false);
      return;
    } else if (!Number(phone) || phone.length != 11) {
      notifyError("ফোন নাম্বার ১১ সংখ্যার হতে হবে");
      setLoading(false);
      return;
    } else if (password.length < 6) {
      notifyError("পাসওয়ার্ড ন্যূনতম ৬ সংখ্যার হতে হবে");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        phone + "@mgent.com",
        password
      );

      const newUser = userCredential.user;
      await setDoc(doc(db, "users", newUser.uid), {
        name,
        phone,
        role,
        createdAt: serverTimestamp(),
      });

      await setDoc(doc(db, "userPrices", newUser.uid), {}, { merge: true });

      notifySuccess("সফলভাবে নতুন ব্যবহারকারী যুক্ত করা হয়েছে");
      e.target.reset();
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        notifyError("এই ফোন নাম্বারের একজন ব্যবহারকারী ইতিমধ্যে আছেন");
      } else {
        notifyError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const clearForm = (e) => {
    e?.preventDefault?.();
    if (formRef.current) {
      formRef.current.reset();
      notifySuccess("ক্লিয়ার করা হয়েছে");
    } else {
      notifyError("ফর্ম খুঁজে পাওয়া যায়নি");
    }
  };

  return (
    <section className="bg-[#0b1024] border-2 border-solid border-[#1f2937] rounded-2xl shadow-[0_6px_28px_rgba(0,0,0,.25)]">
      <Heading text="👥 নতুন ব্যবহারকারী" />
      <form ref={formRef} onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2 p-3">
          <div className="flex flex-row gap-2.5">
            {" "}
            <InputField
              label="ব্যবহারকারীর নাম"
              id="newUserName"
              placeholder="যেমন: Ridwan"
            />{" "}
            <div className="flex flex-col">
              {" "}
              <SelectInput
                id="newUserRole"
                label="ব্যবহারকারীর রোল"
                placeholder="ইউজার রোল"
                options={["user", "admin"]}
              />{" "}
            </div>{" "}
          </div>
          <InputField
            label="ফোন নাম্বার (১১ সংখ্যার হতে হবে)"
            id="newUserPhone"
            placeholder="যেমন: 01234567890"
          />
          <InputField
            label="পাসওয়ার্ড (ন্যূনতম ৬ অক্ষরের)"
            id="newUserPassword"
            placeholder="যেমন: fraghfdfy"
            type="password"
          />
          <div className="flex items-center justify-center gap-2 pt-2">
            <PrimaryButton
              type="submit"
              text={loading ? "Adding..." : "যুক্ত করুন"}
            />
            <SecondaryButton text="ক্লিয়ার" onClick={clearForm} />
          </div>
        </div>
      </form>
    </section>
  );
}
