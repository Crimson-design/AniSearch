import TopBar from "@/components/TopBar";
import WatchLaterList from "@/components/WatchLaterList";

export default function WatchLaterPage() {
  return (
    <>
      <TopBar />
      <main className="container">
        <h1 className="section-title">Watch Later</h1>
        <WatchLaterList />
      </main>
    </>
  );
}