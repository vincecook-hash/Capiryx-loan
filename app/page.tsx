import Link from "next/link";
import Calculator from "@/components/Calculator";
import ReviewCarousel from "@/components/ReviewCarousel";
import Faq from "@/components/Faq";

export default function Home() {
  return (
    <main>
      <div className="herobg"><div className="wrap hero">
        <div>
          <h1>Making life better, one funded plan at a time.</h1>
          <p className="lead">Capiryx connects small business owners and homeowners in St Lucia and Mexico with licensed lender partners. One application, clear terms, and no fees before you are funded. Community funding and grant listings are coming soon.</p>
          <p><Link className="btn" href="/dashboard">Start your application</Link> <Link className="btn alt" href="/#how">See how it works</Link></p>
        </div>
        <Calculator />
      </div></div>
      <div className="strip"><div className="wrap"><span>No fees before you are funded</span><span>Offers shown in full before you sign</span><span>Reviews only from funded members</span></div></div>

      <section className="tint" id="tracks"><div className="wrap">
        <h2>Three ways to get funded</h2>
        <div className="grid3">
          <div className="pcard"><h3>Partner loans <span className="live">Available now</span></h3><p>Licensed lenders and credit unions review your application and make offers. They handle underwriting and send the money directly to you.</p></div>
          <div className="pcard"><h3>Community funding <span className="soon">Coming soon</span></h3><p>Share your plan with backers who want to support local business and housing. Capiryx takes a fee only if your campaign is funded.</p></div>
          <div className="pcard"><h3>Grants and programs <span className="soon">Coming soon</span></h3><p>Search verified government, NGO, and development-bank programs by country, sector, and deadline, and track your applications.</p></div>
        </div>
      </div></section>

      <section id="how"><div className="wrap">
        <h2>How it works</h2>
        <ol className="steps">
          <li><b>Create your account</b><span>Verify your email or phone with a one-time code.</span></li>
          <li><b>Apply</b><span>Tell us about your business or home project and upload your ID.</span></li>
          <li><b>Get an offer</b><span>A lender reviews and sends terms you can read in full.</span></li>
          <li><b>Accept and receive</b><span>Verify your identity, sign online, and the lender sends funds to your bank account.</span></li>
        </ol>
      </div></section>

      <Faq />

      <section className="tint" id="reviews"><div className="wrap">
        <h2>Reviews from funded members</h2>
        <ReviewCarousel />
        <p style={{ marginTop: 14 }}>Funded through Capiryx? <Link href="/dashboard">Log in to share your experience.</Link></p>
      </div></section>
    </main>
  );
}
