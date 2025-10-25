import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@Configs/firebase";
import Heading from "@Components/Heading";
import PrimaryButton from "@Components/PrimaryButton";
import SecondaryButton from "@Components/SecondaryButton";
import { useNotification } from "@Context/NotificationContext";
import { useAuth } from "@Context/AuthContext";

const parseTimestampToDate = (ts) => {
  if (!ts) return null;
  if (typeof ts === "object" && typeof ts.toDate === "function") {
    const d = ts.toDate();
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof ts === "object" && typeof ts.seconds === "number") {
    const d = new Date(ts.seconds * 1000);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof ts === "number") {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof ts === "string") {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

const formatDateBn = (ts) => {
  const d = parseTimestampToDate(ts);
  if (!d) return "";
  try {
    return d.toLocaleString("bn-BD", {
      dateStyle: "medium",
    });
  } catch {
    return d.toLocaleString();
  }
};

export default function UserCatalog() {
  const [users, setUsers] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({});

  const { notifySuccess, notifyError } = useNotification();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setUsers(arr);
        setLoading(false);
      },
      (err) => {
        console.error("users onSnapshot error:", err);
        notifyError("ব্যবহারকারীর তালিকা লোড করা যায়নি");
        setUsers([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [notifyError]);

  const formatWhen = (ts) => {
    const d = parseTimestampToDate(ts);
    if (!d) return "";
    try {
      return d.toLocaleString("bn-BD", {
        dateStyle: "medium",
      });
    } catch {
      return d.toLocaleString();
    }
  };

  const handleToggleRole = async (uid, currentRole) => {
    if (!uid) return;
    if (currentUser?.uid === uid && currentRole === "admin") {
      notifyError("আপনি নিজেকে অ্যাডমিন থেকে ডিমোট করতে পারবেন না");
      return;
    }

    const newRole = currentRole === "admin" ? "user" : "admin";
    setBusy((s) => ({ ...s, [uid]: true }));
    try {
      const ref = doc(db, "users", uid);
      await updateDoc(ref, { role: newRole });
      notifySuccess(`রোল বদলেছে: ${newRole}`);
    } catch (err) {
      console.error(
        "toggleRole error:",
        err.code || err.name,
        err.message || err
      );
      notifyError("রোল পরিবর্তন করা যায়নি");
    } finally {
      setBusy((s) => {
        const copy = { ...s };
        delete copy[uid];
        return copy;
      });
    }
  };

  const handleDelete = async (uid, name) => {
    if (!uid) return;
    if (currentUser?.uid === uid) {
      notifyError("আপনি নিজেকে ডিলিট করতে পারবেন না");
      return;
    }

    const ok = window.confirm(`আপনি কি নিশ্চিত যে "${name}" ডিলিট করতে চান?`);
    if (!ok) return;

    setBusy((s) => ({ ...s, [uid]: true }));
    try {
      await deleteDoc(doc(db, "users", uid));
      notifySuccess("ব্যবহারকারী ডিলিট করা হয়েছে");
    } catch (err) {
      console.error("delete user error:", err);
      notifyError("ব্যবহারকারী ডিলিট করা যায়নি");
    } finally {
      setBusy((s) => {
        const copy = { ...s };
        delete copy[uid];
        return copy;
      });
    }
  };

  return (
    <section className="bg-[#0b1024] border-2 border-solid border-[#1f2937] rounded-2xl shadow-[0_6px_28px_rgba(0,0,0,.25)] p-6">
      <Heading text="👥 ব্যবহারকারীর তালিকা" />

      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left text-[#e6eef6] border-collapse">
          <thead className="bg-[#1f2937] text-[#20c4dd]">
            <tr>
              <th className="p-3 border-b border-[#2d3c56] text-center">নাম</th>
              <th className="p-3 border-b border-[#2d3c56] text-center hidden lg:table-cell">
                ফোন
              </th>
              <th className="p-3 border-b border-[#2d3c56] text-center hidden lg:table-cell">
                রোল
              </th>
              <th className="p-3 border-b border-[#2d3c56] text-center hidden lg:table-cell">
                সময়
              </th>
              <th className="p-3 border-b border-[#2d3c56] text-center">
                অ্যাকশন
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center text-[#94a3b8] p-4">
                  কোনো ব্যবহারকারী পাওয়া যায়নি।
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-[#111a33] transition-colors">
                  <td className="p-3 border-b border-[#1f2937] text-center">
                    {u.name}
                  </td>
                  <td className="p-3 border-b border-[#1f2937] text-center hidden lg:table-cell">
                    {u.phone}
                  </td>
                  <td className="p-3 border-b border-[#1f2937] capitalize text-center hidden lg:table-cell">
                    {u.role}
                  </td>
                  <td className="p-3 border-b border-[#1f2937] text-center hidden lg:table-cell">
                    {formatDateBn(u.createdAt)}
                  </td>
                  <td className="p-3 border-b border-[#1f2937] text-center">
                    <div className="flex gap-2 justify-center">
                      <PrimaryButton
                        text={u.role === "admin" ? "ইউজার বানান" : "এডমিন বানান"}
                        onClick={() => handleToggleRole(u.id, u.role)}
                      />
                      <SecondaryButton
                        text="ডিলিট"
                        onClick={() => handleDelete(u.id, u.name)}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
