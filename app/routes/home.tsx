import { Link } from "react-router";

export function meta() {
  return [{ title: "TrailerDesk | Your dealership, in order" }];
}
export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-24">
      <p className="text-sm font-semibold tracking-widest text-teal-700 uppercase">
        TrailerDesk
      </p>
      <h1 className="mt-4 max-w-2xl text-5xl font-semibold tracking-tight text-slate-950">
        Your lot. Your customers.
        <br />A clearer day ahead.
      </h1>
      <p className="mt-6 max-w-xl text-lg text-slate-600">
        Keep your trailers, leads, and sales moving from one place.
      </p>
      <Link
        className="mt-8 inline-flex rounded-lg bg-teal-800 px-5 py-3 font-medium text-white"
        to="/login"
      >
        Sign in to your dealership
      </Link>
      <p className="mt-16 text-sm text-slate-500">
        Built for utility, cargo, dump, equipment, and specialty trailer
        dealers.
      </p>
    </main>
  );
}
