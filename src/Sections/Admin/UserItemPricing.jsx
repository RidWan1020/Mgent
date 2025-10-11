import Heading from "../../Components/Heading";
import PrimaryButton from "../../Components/PrimaryButton";
import SelectInput from "../../Components/SelectInput";
import NumberInputField from "../../Components/NumberInputField";

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
import { db } from "../../../Config/firebase";
import { useNotification } from "../../../Context/NotificationContext";

export default function UserItemPricing() {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [price, setPrice] = useState("");
  const { notifySuccess, notifyError } = useNotification();

  useEffect(() => {
    // users snapshot
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
      notifyError("প্রথমে ইউজার এবং আইটেম সিলেক্ট করুন");
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

    notifySuccess("User price updated");
    setPrice("");
  };

  return (
    <section className="bg-[#0b1024] border-2 border-solid border-[#1f2937] rounded-2xl shadow-[0_6px_28px_rgba(0,0,0,.25)]">
      <Heading text="👥 ইউজার প্রাইসিং" />
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
            label="আইটেম নির্বাচন"
            id="itemSelect"
            value={selectedItem}
            placeholder="আইটেম নির্বাচন করুন"
            options={products}
            onChange={(e) => setSelectedItem(e.target.value)}
          />
          <NumberInputField
            label="এই ইউজারের জন্য বিক্রয় মূল্য (৳)"
            id="userPrice"
            min={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <PrimaryButton type="submit" text="আপডেট প্রাইজ" />
        </div>
      </form>
    </section>
  );
}
