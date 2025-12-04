import Heading from "@Components/Heading";
import PrimaryButton from "@Components/PrimaryButton";
import SecondaryButton from "@Components/SecondaryButton";
import SelectInput from "@Components/SelectInput";
import NumberInputField from "@Components/NumberInputField";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@Configs/firebase";
import { useNotification } from "@Context/NotificationContext";

export default function UserItemPricing() {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [price, setPrice] = useState(0);
  const { notifySuccess, notifyError } = useNotification();

  useEffect(() => {
    const usersCol = collection(db, "users");
    const unsubUsers = onSnapshot(
      usersCol,
      (snap) => {
        setUsers(
          snap.docs.map((d) => ({ value: d.id, label: d.data().name || d.id }))
        );
      },
      (err) => {
        console.error("users snapshot error", err);
      }
    );

    const productsCol = collection(db, "products");
    const unsubProducts = onSnapshot(
      productsCol,
      (snap) => {
        setProducts(
          snap.docs.map((d) => ({
            value: d.id,
            label: d.data().name || d.id,
            price: d.data().price,
          }))
        );
      },
      (err) => {
        console.error("products snapshot error", err);
      }
    );

    return () => {
      unsubUsers();
      unsubProducts();
    };
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!selectedUser || !selectedItem) {
      notifyError("প্রথমে ব্যবহারকারী এবং পণ্য সিলেক্ট করুন");
      return;
    }
    const priceNum = Number(price);
    if (!priceNum || priceNum <= 0) {
      notifyError("সঠিক মূল্য দিন");
      return;
    }

    const userPricesRef = doc(db, "userPrices", selectedUser);
    const existing = await getDoc(userPricesRef);
    const data = existing.exists() ? existing.data() : {};

    data[selectedItem] = priceNum;
    await setDoc(
      userPricesRef,
      { ...data, updatedAt: serverTimestamp() },
      { merge: true }
    );

    notifySuccess("মূল্য সফলভাবে পরিবর্তন করা হয়েছে");
    setPrice(0);
  };

  const clearForm = () => {
    setSelectedUser("");
    setSelectedItem("");
    setPrice(0);
    notifySuccess("ফর্ম ক্লিয়ার করা হয়েছে");
  };

  return (
    <section className="bg-[#0b1024] border-2 border-solid border-[#1f2937] rounded-2xl shadow-[0_6px_28px_rgba(0,0,0,.25)] p-4">
      <Heading text="ব্যবহারকারীভিত্তিক মূল্য" />
      <form onSubmit={handleApply}>
        <div className="flex flex-col gap-4 p-3">
          <SelectInput
            label="ইউজারের নাম"
            id="userName"
            value={selectedUser}
            placeholder="ইউজার নির্বাচন করুন"
            options={users}
            onChange={(e) => setSelectedUser(e.target.value)}
          />
          <SelectInput
            label="পণ্য নির্বাচন"
            id="itemSelect"
            value={selectedItem}
            placeholder="পণ্য নির্বাচন করুন"
            options={products}
            onChange={(e) => setSelectedItem(e.target.value)}
          />
          <NumberInputField
            label="এই ব্যবহারকারীর জন্য বিক্রয়মূল্য"
            id="userPrice"
            min={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <div className="flex items-center justify-center gap-2 pt-2">
            <PrimaryButton type="submit" text="মূল্য আপডেট করুন" />
            <SecondaryButton text="ক্লিয়ার" onClick={clearForm} />
          </div>
        </div>
      </form>
    </section>
  );
}
