import TopBar from "@/components/TopBar";
import MyReviews from "@/components/MyReviews";

export default function MyReviewsPage() {
  return (
    <>
      <TopBar />
      <main className="container">
        <h1 className="section-title">My Reviews</h1>
        <MyReviews />
      </main>
    </>
  );
}