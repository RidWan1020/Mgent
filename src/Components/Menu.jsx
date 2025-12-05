"use client";

import React, { useState, useEffect, useRef } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@Configs/firebase";
import { useAuth } from "@Context/AuthContext";
import { useNavigate } from "react-router-dom";
import { hover } from "framer-motion";

const DropdownMenu = ({ children, trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-64 bg-[#0b1024] border-2 border-solid border-[#1f2937] rounded-2xl shadow-[0_6px_28px_rgba(0,0,0,.25)] p-2 z-50">
          {children}
        </div>
      )}
    </div>
  );
};

const DropdownMenuItem = ({ children, onClick, logout = false }) => (
  <button
    onClick={onClick}
    className={`w-full text-left font-medium flex items-center px-3 py-2.5 text-sm rounded-lg transition duration-200 ${
      logout ? "hover:bg-red-600" : "hover:bg-[#111a33]"
    } `}
  >
    {children}
  </button>
);

const DropdownMenuSeparator = () => (
  <div className="my-2 h-px bg-zinc-200 dark:bg-zinc-700" />
);

export default function Dropdown() {
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
    <div className="flex items-center justify-center px-3.5 py-4">
      <DropdownMenu
        trigger={
          <button className="px-4 pt-2 pb-1 rounded-lg text-[#041315] text-lg cursor-pointer bg-[#20c4dd] hover:bg-[#0891b2] transition duration-200">
            মেনু
          </button>
        }
      >
        <div className="flex flex-col space-y-1">
          <DropdownMenuItem onClick={() => navigate("/")}>
            <span>হোম পেইজ</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => navigate("/cart")}>
            <span>আপনার কার্ট</span>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleLogout} logout="true">
          <span>লগ-আউট</span>
        </DropdownMenuItem>
      </DropdownMenu>
    </div>
  );
}
