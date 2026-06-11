import { redirect } from "next/navigation";
import { consoleUrl } from "@/lib/domains";

export default function RegisterPage() {
  redirect(consoleUrl("/signup"));
}
