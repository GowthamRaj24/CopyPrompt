import { redirect } from "next/navigation";

/** @deprecated Use /account#my-prompts */
export default function AccountPromptsRedirect() {
  redirect("/account#my-prompts");
}
