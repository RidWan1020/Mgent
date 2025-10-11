import { useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../../../Config/firebase";

import Heading from "../../Components/Heading";
import SecondaryButton from "../../Components/SecondaryButton";
import AccordionItem from "../../Components/AccordionItem";
import InputField from "../../Components/InputField";
import SelectInput from "../../Components/SelectInput";
import { useNotification } from "../../../Context/NotificationContext";

export default function UserItemRequests() {
  const { notifySuccess, notifyError } = useNotification();

  const [requests, setRequests] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(true);

  // filter/search state
  const [filterBy, setFilterBy] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // load requests in real-time
  useEffect(() => {
    const q = query(
      collection(db, "itemRequest"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRequests(data);
        setLoading(false);
      },
      (err) => {
        console.error("itemRequest onSnapshot error:", err);
        notifyError("Failed to load requests (see console).");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [notifyError]);

  const formatWhen = (ts) => {
    if (!ts) return "";
    if (typeof ts === "number") return new Date(ts).toLocaleString();
    if (ts?.toDate) return ts.toDate().toLocaleString();
    if (ts?.seconds) return new Date(ts.seconds * 1000).toLocaleString();
    return String(ts);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this request?"))
      return;

    // optimistic update
    const prev = requests;
    setRequests((prevList) => prevList.filter((r) => r.id !== id));

    try {
      await deleteDoc(doc(db, "itemRequest", id));
      notifySuccess("Request deleted");
    } catch (err) {
      console.error("Error deleting request:", err);
      notifyError("Failed to delete request. It will be reloaded.");
      setRequests(prev); // rollback
    }
  };

  // Derived filtered list (memoized)
  const filteredRequests = useMemo(() => {
    if (
      !searchQuery ||
      searchQuery.trim() === "" ||
      (filterBy === "All" && searchQuery.trim() === "")
    ) {
      return requests;
    }

    const q = searchQuery.trim().toLowerCase();

    return requests.filter((r) => {
      if (filterBy === "All") {
        // search across requestedBy, name, explanation
        return (
          String(r.requestedBy || "")
            .toLowerCase()
            .includes(q) ||
          String(r.name || "")
            .toLowerCase()
            .includes(q) ||
          String(r.explanation || "")
            .toLowerCase()
            .includes(q)
        );
      } else if (filterBy === "User") {
        return String(r.requestedBy || "")
          .toLowerCase()
          .includes(q);
      } else if (filterBy === "Item") {
        return String(r.name || "")
          .toLowerCase()
          .includes(q);
      }
      return true;
    });
  }, [requests, filterBy, searchQuery]);

  const clearSearch = () => {
    setSearchQuery("");
    setFilterBy("");
  };

  return (
    <section className="bg-[#0b1024] border-2 border-solid border-[#1f2937] rounded-2xl shadow-[0_6px_28px_rgba(0,0,0,.25)]">
      <Heading text="📨 ইউজার থেকে আইটেম রিকোয়েস্ট" />
      <div className="px-3 py-3">
        {/* Filter + Search controls */}
        <div className="flex md:items-center gap-3 mb-3">
          <SelectInput
            id="filterBy"
            placeholder="Filter"
            value={filterBy}
            options={["All", "User", "Item"]}
            onChange={(e) => setFilterBy(e.target.value)}
          />
          <InputField
            id="searchRequests"
            placeholder={
              filterBy === "User"
                ? "Search user..."
                : filterBy === "Item"
                ? "Search item..."
                : "Search requests..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <SecondaryButton text="Clear" onClick={clearSearch} />
        </div>

        {loading && (
          <div className="text-sm text-[#94a3b8] px-3 py-2">লোড হচ্ছে...</div>
        )}

        {!loading && filteredRequests.length === 0 && (
          <div className="text-sm text-[#94a3b8] px-3 py-4">
            কোনো রিকোয়েস্ট নেই
          </div>
        )}

        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const when = formatWhen(req.createdAt);
            const title = req.name || "—";
            const subtitle = `${req.requestedBy || "Guest"} • ${when}`;
            const icon = String(req.requestedBy || "G")
              .charAt(0)
              .toUpperCase();

            return (
              <AccordionItem
                key={req.id}
                id={`request-${req.id}`}
                title={title}
                subtitle={subtitle}
                icon={icon}
                isOpen={openId === req.id}
                onToggle={() => setOpenId(openId === req.id ? null : req.id)}
              >
                <div className="mb-3 text-sm text-[#d7eaf6]">
                  <strong>বিবরণ:</strong>
                  <div className="mt-1 text-[#cfeefb]">
                    {req.explanation || "—"}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <SecondaryButton
                    text="Delete"
                    onClick={() => handleDelete(req.id)}
                  />
                </div>
              </AccordionItem>
            );
          })}
        </div>
      </div>
    </section>
  );
}
