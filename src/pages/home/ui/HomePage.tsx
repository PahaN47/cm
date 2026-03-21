import { cn } from "@/shared/lib";
import "./HomePage.scss";

const b = cn("home-page");

export function HomePage() {
  return (
    <main className={b()}>
      <h1 className={b("title")}>Home</h1>
    </main>
  );
}
