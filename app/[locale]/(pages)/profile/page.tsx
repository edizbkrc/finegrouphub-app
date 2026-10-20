import OpsLayoutPage from "@layout/OpsLayoutPage";
import Profile from "@/features/profile/Profile";

export default function ProfilePage() {
  return (
    <OpsLayoutPage titleKey="Pages.UserProfile">
      <Profile />
    </OpsLayoutPage>
  );
}
