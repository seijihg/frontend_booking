import { User } from "@/types/user";

interface ProfileProps {
  user: User;
}

const profile: React.FC<ProfileProps> = async ({ user }) => {
  return <>{user.phone_number}</>;
};

export default profile;
