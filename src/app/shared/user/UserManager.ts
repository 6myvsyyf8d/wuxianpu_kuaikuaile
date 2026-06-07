import { loadJson, saveJson, generateId } from "../storage";
import type { UserProfile, UsersStore } from "./types";

const USERS_KEY = "piano-users";

export function loadUsers(): UsersStore {
  return loadJson<UsersStore>(USERS_KEY, { users: [], activeUserId: "" });
}

function saveUsers(store: UsersStore): void {
  saveJson(USERS_KEY, store);
}

export function getActiveUser(): UserProfile | null {
  const store = loadUsers();
  return store.users.find(u => u.id === store.activeUserId) ?? null;
}

export function createUser(name: string, avatar: string): UserProfile {
  const store = loadUsers();
  const user: UserProfile = {
    id: generateId(),
    name: name.trim() || "小琴童",
    avatar,
    createdAt: new Date().toISOString().split("T")[0],
  };
  store.users.push(user);
  store.activeUserId = user.id;
  saveUsers(store);
  return user;
}

export function switchUser(userId: string): void {
  const store = loadUsers();
  if (store.users.some(u => u.id === userId)) {
    store.activeUserId = userId;
    saveUsers(store);
  }
}

export function ensureDefaultUser(): UserProfile {
  const store = loadUsers();
  if (store.users.length === 0) {
    return createUser("小琴童", "🎹");
  }
  if (!store.activeUserId || !store.users.some(u => u.id === store.activeUserId)) {
    store.activeUserId = store.users[0].id;
    saveUsers(store);
  }
  return store.users.find(u => u.id === store.activeUserId) ?? store.users[0];
}

export function getAllUsers(): UserProfile[] {
  return loadUsers().users;
}
