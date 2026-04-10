export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
      <h1>Privacy Policy</h1>

      <p>
        This application ("ID Radar") is designed to analyze publicly available
        information to estimate identity exposure risk.
      </p>

      <h2>Data Input</h2>
      <p>
        You may enter personal data such as name, city, or username. This data is
        processed only temporarily to perform the scan.
      </p>

      <h2>No Permanent Storage</h2>
      <p>
        We do not store your input data permanently. All scans are processed in
        real-time and are not saved in a database.
      </p>

      <h2>Third-Party Services</h2>
      <p>
        This app uses external services (e.g. SerpAPI) to retrieve publicly
        available search results. These services may process request data as part
        of their functionality.
      </p>

      <h2>Hosting</h2>
      <p>
        This application is hosted on Vercel. Technical data such as IP address
        may be processed for security and performance reasons.
      </p>

      <h2>No Tracking</h2>
      <p>
        We currently do not use tracking cookies or analytics tools.
      </p>

      <h2>Your Responsibility</h2>
      <p>
        You are responsible for ensuring that you only scan your own data or data
        you are authorized to use.
      </p>

      <h2>Contact</h2>
      <p>
        For any privacy-related questions, please contact: hello@idradar.ch
      </p>
    </main>
  );
}