import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@Configs/firebase";

import Products from "@Components/Products";
import Header from "@Components/Heading";
import InputField from "@Components/InputField";

export default function ProductsCatalog() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItems(data);
    });

    return () => unsub();
  }, []);

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="bg-[#0b1024] border-2 border-solid border-[#1f2937] shadow-[0_6px_28px_rgba(0,0,0,.25)] rounded-2xl">
      <Header text="🧱 পণ্য তালিকা" />
      <div className="p-2.5">
        <div className="md:items-center p-2 gap-3">
          <InputField
            placeholder="সার্চ করুন..."
            id="searchItems"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="px-2.5 py-3">
          <div
            id="catalog"
            role="region"
            aria-label="Product list"
            className="max-h-screen lg:max-h-80 overflow-y-auto space-y-3 pr-2"
          >
            {filtered.length > 0 ? (
              filtered.map((item) => <Products key={item.id} product={item} />)
            ) : (
              <p className="text-gray-400">কোনো প্রোডাক্ট পাওয়া যায়নি</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

