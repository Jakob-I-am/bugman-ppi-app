// Business and inspector details used across the site, emails and reports.
// Replace every placeholder before going live.
export const site = {
  name: "Harbourside Building & Pest",
  phone: "0400 000 000",
  phoneHref: "tel:+61400000000",
  email: "bookings@example.com.au",
  area: "Sydney",
  abn: "00 000 000 000",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};

/** Printed on every report. AS 4349 reports must identify the inspector. */
export const inspector = {
  name: "Your Name",
  credentials: [
    "NSW builder licence no. 000000C",
    "NSW EPA pest management technician licence no. 0000000",
    "Certificate IV in Building and Construction",
  ],
  insurance: "Professional indemnity and public liability insured",
};
