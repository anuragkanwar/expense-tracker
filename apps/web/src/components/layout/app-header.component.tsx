import { SidebarTrigger } from "../ui/sidebar";

export const AppHeader = () => {
  return (
    <header className="flex gap-2">
      <SidebarTrigger />
      <div>Header</div>
    </header>
  );
};
