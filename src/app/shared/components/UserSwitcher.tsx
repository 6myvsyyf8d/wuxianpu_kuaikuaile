import { useState, useRef, useEffect } from "react";
import type { UserProfile } from "../user/types";
import { getAllUsers } from "../user/UserManager";

interface Props {
  activeUser: UserProfile;
  onSwitch: (userId: string) => void;
  onNewUser: () => void;
}

export default function UserSwitcher({ activeUser, onSwitch, onNewUser }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  const isImage = activeUser.avatar.startsWith("data:");

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100"
      >
        {isImage ? (
          <img
            src={activeUser.avatar}
            alt={activeUser.name}
            className="w-7 h-7 rounded-full border object-cover"
          />
        ) : (
          <span className="text-xl">{activeUser.avatar}</span>
        )}
        <span className="text-sm font-medium">{activeUser.name}</span>
        <span className="text-xs text-gray-400">▼</span>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 w-48 bg-white border rounded shadow-lg z-50">
          <div className="p-1">
            {getAllUsers().map((user) => {
              const isActive = user.id === activeUser.id;
              const userImg = user.avatar.startsWith("data:");
              return (
                <div
                  key={user.id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm ${
                    isActive ? "bg-blue-50" : ""
                  }`}
                >
                  {userImg ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-6 h-6 rounded-full border object-cover"
                    />
                  ) : (
                    <span className="text-base">{user.avatar}</span>
                  )}
                  <span className="flex-1 truncate">{user.name}</span>
                  {!isActive && (
                    <button
                      type="button"
                      onClick={() => {
                        onSwitch(user.id);
                        setOpen(false);
                      }}
                      className="text-xs px-2 py-0.5 rounded bg-blue-500 text-white hover:bg-blue-600"
                    >
                      切换
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="border-t p-1">
            <button
              type="button"
              onClick={() => {
                onNewUser();
                setOpen(false);
              }}
              className="w-full text-sm px-2 py-1.5 rounded text-center text-gray-600 hover:bg-gray-100"
            >
              新增用户
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
