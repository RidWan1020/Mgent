import { useState } from "react";
import { useNotification } from "../../../Context/NotificationContext";

// Components
import Heading from "../../Components/Heading";
import PrimaryButton from "../../Components/PrimaryButton";
import InputField from "../../Components/InputField";
import SelectInput from "../../Components/SelectInput";

// Firebase
import { db, secondaryAuth } from "../../../Config/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function NewUserAdding() {
  const [loading, setLoading] = useState(false);
  const { notifySuccess, notifyError } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const name = e.target.newUserName.value;
    const phone = e.target.newUserPhone.value;
    const password = e.target.newUserPassword.value;
    const role = e.target.newUserRole.value;

    if (!name || !phone || !password) {
      notifyError("All fields are required.");
      setLoading(false);
      return;
    } else if (phone.length != 11) {
      notifyError("Phone number must be 11 digits.");
      setLoading(false);
      return;
    } else if (password.length < 6) {
      notifyError("Password must be at least 6 characters.");
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

      notifySuccess("User created successfully!");
      e.target.reset();
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        notifyError("A user with this phone number already exists.");
      } else {
        notifyError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-[#0b1024] border-2 border-solid border-[#1f2937] rounded-2xl shadow-[0_6px_28px_rgba(0,0,0,.25)]">
      <Heading text="👥 নতুন ইউজার" />
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2 p-3">
          <div className="flex flex-row gap-2.5">
            {" "}
            <InputField
              label="নাম"
              id="newUserName"
              placeholder="যেমন: Ridwan"
            />{" "}
            <div className="flex flex-col">
              {" "}
              <SelectInput
                id="newUserRole"
                label="ইউজার রোল"
                placeholder="ইউজার রোল"
                options={["User", "Admin"]}
              />{" "}
            </div>{" "}
          </div>
          <InputField
            label="ফোন নাম্বার"
            id="newUserPhone"
            placeholder="যেমন: 01234567890"
          />
          <InputField
            label="পাসওয়ার্ড"
            id="newUserPassword"
            placeholder="যেমন: fraghfdfy"
            type="password"
          />
          <PrimaryButton
            type="submit"
            text={loading ? "Adding..." : "ইউজার এড"}
          />
        </div>
      </form>
    </section>
  );
}
