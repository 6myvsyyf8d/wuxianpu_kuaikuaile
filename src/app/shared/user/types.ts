export interface UserProfile {
  id: string;
  name: string;
  avatar: string; // base64 image data or emoji
  createdAt: string;
}

export interface UsersStore {
  users: UserProfile[];
  activeUserId: string;
}
