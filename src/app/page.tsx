import Link from 'next/link';
import { EnquiryForm } from '@/components/EnquiryForm';
import { site } from '@/lib/site';

const pests = [
  {
    name: 'Rats and mice',
    note: 'Baiting, trapping and proofing the gaps they get in through.',
  },
  {
    name: 'Wasps and hornets',
    note: 'Nests treated the same or next day in season.',
  },
  {
    name: 'Bed bugs',
    note: 'Full room treatments with a follow-up visit included.',
  },
  {
    name: 'Cockroaches',
    note: 'Gel baits and monitoring for kitchens and commercial sites.',
  },
  {
    name: 'Fleas',
    note: 'Whole-property treatment once your pets are treated too.',
  },
  {
    name: 'Moths and carpet beetles',
    note: 'Treatment for carpets, wardrobes and lofts.',
  },
  { name: 'Birds', note: 'Netting, spikes and guano clearance.' },
  { name: 'Squirrels', note: 'Loft clearance and proofing of entry points.' },
];

const steps = [
  {
    title: 'Get in touch',
    body: "Send the form or call. We'll ask a few questions and book a time that suits you.",
  },
  {
    title: 'We inspect',
    body: "A technician finds what's there, how it's getting in and how bad it is.",
  },
  {
    title: 'We treat',
    body: 'Treatment and proofing, explained as we go, with safety advice for your household.',
  },
  {
    title: 'You get the report',
    body: 'Findings, treatment and photos from the visit, ready to view online.',
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
              className='hidden sm:inline hover:text-signal'
            >
              {site.phone}
            </a>
            <Link
              href='/login'
              className='hover:text-signal'
            >
              View a report
            </Link>
          </nav>
        </div>
      </header>

      <section className='bg-pine text-white'>
        <div className='mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-10 md:grid-cols-[1.15fr_1fr] md:gap-14 md:pb-20 md:pt-16'>
          <div className='max-w-xl'>
            <h1 className='display text-6xl sm:text-7xl lg:text-8xl'>
              Pest control you can see working.
            </h1>
            <p className='mt-6 max-w-md text-lg leading-relaxed text-white/80'>
              Homes and businesses across {site.area}. Every visit is
              photographed and written up, so you can check exactly what we
              found and what we did, from your phone.
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
            id='enquire'
          >
            <h2 className='display text-3xl text-pine'>Ask for a visit</h2>
            <p className='mb-6 mt-2 text-stone'>
              Tell us what you&apos;re seeing and we&apos;ll call you back.
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
        <h2 className='display text-5xl text-pine'>What we deal with</h2>
        <dl className='mt-10 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-4'>
          {pests.map((p) => (
            <div
              key={p.name}
              className='border-t-2 border-pine py-5'
            >
              <dt className='text-lg font-bold'>{p.name}</dt>
              <dd className='mt-1 text-stone'>{p.note}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className='border-y border-line bg-white'>
        <div className='mx-auto max-w-6xl px-5 py-16 md:py-24'>
          <h2 className='display text-5xl text-pine'>How a visit works</h2>
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
            After each visit you&apos;ll get an email when your report is ready.
            Sign in with your email address to see the findings, the treatment
            used and every photo, any time you need them: for a landlord, a
            letting agent or your own records.
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
            href='#enquire'
            className='btn-quiet'
          >
            Ask for a visit
          </a>
        </div>
      </section>

      <footer className='bg-pine-dark text-white/80'>
        <div className='mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm sm:flex-row sm:justify-between'>
          <p>
            {site.name}. Serving {site.area}.
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
