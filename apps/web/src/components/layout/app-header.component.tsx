import { Bell, Search } from "lucide-react";
import { useUser } from "@/api/auth/auth.hook";
import { ModeToggle } from "../mode-toggle";
import { Button } from "../ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import { Separator } from "../ui/separator";
import { SidebarTrigger } from "../ui/sidebar";
import { NavUser } from "./nav-user";

export const AppHeader = () => {
  const user = useUser();
  return (
			<div className="px-2">
				<header className="flex gap-2 h-14 items-center justify-between px-2">
					<div>
						<SidebarTrigger size={"icon"} variant={"outline"} />
					</div>
					<div className="flex gap-4 items-center">
						<InputGroup>
							<InputGroupInput placeholder="Search..." />
							<InputGroupAddon>
								<Search />
							</InputGroupAddon>
          </InputGroup>
          <Separator orientation="vertical" />
						<div className="flex gap-2">
							<Button size={"icon"} variant={"outline"}>
								<Bell />
							</Button>
							<ModeToggle />
						</div>
						<Separator className="self-stretch" orientation="vertical" />
						<NavUser user={user.data} />
					</div>
				</header>
				<Separator />
			</div>
		);
};
