import Link from 'next/link';
import { EnquiryForm } from '@/components/EnquiryForm';
import { site } from '@/lib/site';

const areas = [
  {
    name: 'Site',
    note: 'Fences, retaining walls, paths, drainage and trees within 30 metres of the house.',
  },
  {
    name: 'Exterior',
    note: 'Walls, windows, doors, eaves, gutters, stairs and balustrades.',
  },
  {
    name: 'Roof',
    note: 'Roof covering, flashings and valleys, and the framing, sarking and insulation inside the roof space.',
  },
  {
    name: 'Subfloor',
    note: "Piers, bearers, joists, ventilation and moisture, where there's safe access.",
  },
  {
    name: 'Interior',
    note: 'Every room, with close attention to bathrooms, laundries and other wet areas.',
  },
  {
    name: 'Timber pests',
    note: 'Termites, borers and wood decay, plus the conditions that attract them.',
  },
];

const steps = [
  {
    title: 'Book',
    body: 'Send the form or call. We confirm the time with you and the agent and send the inspection agreement.',
  },
  {
    title: 'Inspect',
    body: "A thorough visual inspection of every accessible area, photographed as we go. You're welcome to attend.",
  },
  {
    title: 'Read your report',
    body: 'Defects, safety hazards and timber pest findings, each with photos, in a report you can open on your phone.',
  },
  {
    title: 'Ask us',
    body: 'Call us about anything in the report before you exchange contracts.',
  },
];

export default function Home() {
  return (
    <>
      <header className='bg-pine text-white'>
        <div className='mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4'>
          <Link
            href='/'
            className='display text-2xl'
          >
            {site.name}
          </Link>
          <nav className='flex items-center gap-5 text-sm font-semibold'>
            <a
              href={site.phoneHref}
              className='hidden hover:text-signal sm:inline'
            >
              {site.phone}
            </a>
            <Link
              href='/login'
              className='hover:text-signal'
            >
              view a report
            </Link>
          </nav>
        </div>
      </header>

      <section className='bg-pine text-white'>
        <div className='mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-10 md:grid-cols-[1.15fr_1fr] md:gap-14 md:pb-20 md:pt-16'>
          <div className='max-w-xl'>
            <h1 className='display text-6xl sm:text-7xl lg:text-8xl'>
              Know what you&apos;re buying.
            </h1>
            <p className='mt-6 max-w-md text-lg leading-relaxed text-white/80'>
              Pre-purchase building and timber pest inspections across{' '}
              {site.area}, reported to Australian Standards AS 4349.1 and AS
              4349.3. Every finding comes with photos, in a report you can read
              on your phone before you sign.
            </p>
            <a
              href={site.phoneHref}
              className='btn-signal mt-8'
            >
              Call {site.phone}
            </a>
          </div>

          <div
            className='rounded-lg bg-white p-6 text-ink sm:p-8'
            id='book'
          >
            <h2 className='display text-3xl text-pine'>Book an inspection</h2>
            <p className='mb-6 mt-2 text-stone'>
              Tell us about the property and we&apos;ll call you to arrange it.
            </p>
            <EnquiryForm />
          </div>
        </div>
      </section>

      <div
        className='tape h-4'
        aria-hidden='true'
      />

      <section className='mx-auto max-w-6xl px-5 py-16 md:py-24'>
        <h2 className='display text-5xl text-pine'>What we inspect</h2>
        <dl className='mt-10 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3'>
          {areas.map((a) => (
            <div
              key={a.name}
              className='border-t-2 border-pine py-5'
            >
              <dt className='text-lg font-bold'>{a.name}</dt>
              <dd className='mt-1 text-stone'>{a.note}</dd>
            </div>
          ))}
        </dl>
        <p className='mt-6 max-w-2xl text-sm text-stone'>
          Inspections are visual and non-invasive. Anywhere we can&apos;t safely
          reach, such as a sealed roof space or a subfloor without access, is
          listed in your report with the reason.
        </p>
      </section>

      <section className='border-y border-line bg-white'>
        <div className='mx-auto max-w-6xl px-5 py-16 md:py-24'>
          <h2 className='display text-5xl text-pine'>How it works</h2>
          <ol className='mt-10 grid gap-8 md:grid-cols-4'>
            {steps.map((s, i) => (
              <li key={s.title}>
                <span className='display flex h-12 w-12 items-center justify-center rounded-full bg-signal text-2xl text-pine-dark'>
                  {i + 1}
                </span>
                <h3 className='mt-4 text-lg font-bold'>{s.title}</h3>
                <p className='mt-1 text-stone'>{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className='mx-auto grid max-w-6xl gap-8 px-5 py-16 md:grid-cols-2 md:items-center md:py-24'>
        <div>
          <h2 className='display text-5xl text-pine'>
            Your report stays online
          </h2>
          <p className='mt-4 max-w-md text-lg leading-relaxed text-stone'>
            We email you when the report is ready. Sign in with your email
            address to see the summary, every finding and every photo, and come
            back to it whenever you need to, whether that&apos;s for your
            solicitor, your builder or a quote for repairs.
          </p>
        </div>
        <div className='flex flex-wrap gap-3 md:justify-end'>
          <Link
            href='/login'
            className='btn-primary'
          >
            View your report
          </Link>
          <a
            href='#book'
            className='btn-quiet'
          >
            Book an inspection
          </a>
        </div>
      </section>

      <footer className='bg-pine-dark text-white/80'>
        <div className='mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm sm:flex-row sm:justify-between'>
          <p>
            {site.name}. ABN {site.abn}. Serving {site.area}.
          </p>
          <p>
            <a
              href={site.phoneHref}
              className='hover:text-signal'
            >
              {site.phone}
            </a>
            <span className='mx-2'>|</span>
            <a
              href={`mailto:${site.email}`}
              className='hover:text-signal'
            >
              {site.email}
            </a>
          </p>
        </div>
      </footer>
    </>
  );
}
