export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "40px 20px" }}>
      <h1>Privacy Policy</h1>

      <p>
        This Privacy Policy explains how ID Radar processes personal data when you
        use this website and its identity risk scanning features.
      </p>

      <h2>1. Controller</h2>
      <p>
        The controller responsible for data processing on this website is the
        operator of ID Radar.
      </p>
      <p>
        Contact: <a href="mailto:hello@idradar.ch">hello@idradar.ch</a>
      </p>

      <h2>2. What data you may enter</h2>
      <p>
        You may voluntarily enter personal data such as:
      </p>
      <ul>
        <li>first name</li>
        <li>last name</li>
        <li>city</li>
        <li>username</li>
        <li>email address</li>
      </ul>

      <h2>3. Purpose of processing</h2>
      <p>
        We process the submitted data only to generate an identity exposure and
        identity risk assessment based on publicly available search results and
        matching signals.
      </p>

      <h2>4. No permanent storage of scan inputs</h2>
      <p>
        At the current stage of the product, scan inputs are processed only within
        the request needed to generate the result. We do not intentionally store
        the submitted scan fields in a database for long-term retention.
      </p>

      <h2>5. Public-source analysis</h2>
      <p>
        The scanner evaluates publicly accessible information and search result
        patterns. Results are estimates and do not represent verified facts about
        identity theft, account ownership, or legal wrongdoing.
      </p>

      <h2>6. Third-party services</h2>
      <p>
        To provide the scanning functionality, this website may rely on third-party
        infrastructure or service providers, such as:
      </p>
      <ul>
        <li>hosting providers</li>
        <li>search-result aggregation providers</li>
        <li>technical infrastructure and security providers</li>
      </ul>
      <p>
        These providers may process technical request data where necessary for
        delivery, security, and functionality.
      </p>

      <h2>7. Hosting and server logs</h2>
      <p>
        This website is hosted via external infrastructure providers. As with most
        websites, technical server data such as IP address, request timestamps,
        browser information, and device-related metadata may be processed in server
        logs for stability, security, and abuse prevention.
      </p>

      <h2>8. Cookies and analytics</h2>
      <p>
        At this stage, we do not intentionally use login accounts, user profiles,
        or a permanent customer database for the scan function itself. If analytics,
        cookies, or additional measurement tools are added later, this Privacy
        Policy will be updated accordingly.
      </p>

      <h2>9. Disclosure to third parties</h2>
      <p>
        We do not sell your personal data. Data may be disclosed to service
        providers only where this is technically necessary to operate the website
        and scanning functionality.
      </p>

      <h2>10. International data processing</h2>
      <p>
        Depending on the infrastructure and third-party tools used, technical data
        may be processed outside Switzerland. Where applicable, such processing is
        limited to what is necessary to provide the service.
      </p>

      <h2>11. Data retention</h2>
      <p>
        We aim to keep personal data only for as long as necessary for the
        respective purpose. Because scan inputs are currently designed to be
        processed temporarily, long-term retention is not intended for those fields.
        Technical logs may be retained for a limited period where necessary for
        security and operations.
      </p>

      <h2>12. Your rights</h2>
      <p>
        Under applicable data protection law, you may have the right to request
        information about personal data processed about you, and where applicable
        request correction or deletion.
      </p>
      <p>
        For such requests, contact:{" "}
        <a href="mailto:hello@idradar.ch">hello@idradar.ch</a>
      </p>

      <h2>13. User responsibility</h2>
      <p>
        You may only use this tool to scan your own data or data you are authorized
        to use. You are responsible for ensuring that your use of this tool is
        lawful.
      </p>

      <h2>14. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy at any time to reflect technical,
        operational, or legal changes. The latest version published on this page
        applies.
      </p>
    </main>
  );
}