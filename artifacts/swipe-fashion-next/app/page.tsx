import { redirect } from "next/navigation";

// Halaman pertama yang dilihat pengunjung adalah welcome. Feed swipe kini
// tinggal di /feed.
export default function HomePage() {
  redirect("/welcome");
}
