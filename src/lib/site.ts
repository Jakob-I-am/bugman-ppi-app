// Business and inspector details used across the site, emails and reports.
// Replace every placeholder before going live.
export const site = {
  name: '1300 Bugman',
  phone: '1300 284 626',
  phoneHref: 'tel:+61400000000',
  email: 'bugman@gmail.com',
  area: 'Central west, NSW',
  abn: '71 159 351 390',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
};

/** Printed on every report. AS 4349 reports must identify the inspector. */
export const inspector = {
  name: 'Paul Lewin',
  credentials: ['NSW EPA pest management technician licence no. 5067442'],
  insurance: 'Professional indemnity and public liability insured',
};
