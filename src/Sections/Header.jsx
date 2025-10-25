import SecondaryButton from "@Components/SecondaryButton";

import { signOut } from "firebase/auth";
import { auth } from "@Configs/firebase";
import { useAuth } from "@Context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Header({ Logo }) {
  const { name, setUser, setRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setRole(null);
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <header className="flex items-center justify-between gap-2.5 px-3.5 py-4 backdrop-blur-sm bg-[#040b1a] text-white sticky top-0 border-b border-[#1f2937]">
      <img src={Logo} alt="Logo" className="h-10" />
      <div className="flex gap-2">
        <div className="flex gap-1.5 items-center bg-[#061227] border border-[#2c4466] text-[#93c5fd] p-3 rounded-lg text-sm">
          {name || "Username"}
        </div>
        <SecondaryButton text="লগ-আউট" onClick={handleLogout} />
      </div>
    </header>
  );
}
