import { redirect } from "next/navigation";

/** Kısa URL: /kvkk → aynı aydınlatma metni */
export default function KvkkRedirectPage() {
  redirect("/gizlilik");
}
