import { useState } from "react";

// Firebase
import { auth } from "../../Config/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

// Components
import Logo from "../assets/logo.png";
import InputField from "../Components/InputField";
import NumberInputField from "../Components/NumberInputField";
import PrimaryButton from "../Components/PrimaryButton";
import { useNotification } from "../../Context/NotificationContext";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const { notifySuccess, notifyError } = useNotification();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const phone = e.target.userPhone.value.trim();
    const password = e.target.userPassword.value;

    if (!phone || !password) {
      notifyError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        phone + "@mgent.com",
        password
      );
      setUser(userCredential.user);
      e.target.reset();
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        notifyError("No user found with this phone.");
      } else if (err.code === "auth/wrong-password") {
        notifyError("Incorrect password.");
      } else {
        notifyError("Login failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center  justify-center min-h-screen text-[#e5e7eb] text-sm bg-gradient-to-b from-[#0b1024] to-[#020617]">
      <section className="flex flex-col justify-center w-1/2 bg-[#0b1024] border-2 border-solid border-[#1f2937] rounded-2xl shadow-[0_6px_28px_rgba(0,0,0,.25)]">
        <div className="flex items-center justify-center">
          <img src={Logo} alt="Logo" className="pt-4 w-50" />
        </div>
        <form onSubmit={handleLogin}>
          <div className="px-2.5 py-3">
            <NumberInputField label="ফোন নাম্বার" id="userPhone" />
            <InputField
              label="পাসওয়ার্ড"
              type="password"
              id="userPassword"
              placeholder="যেমন: abxcgsk"
            />
            <div className="pt-4 flex items-center justify-center">
              <PrimaryButton
                text={loading ? "Logging in..." : "লগিন"}
                type="submit"
              />
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
