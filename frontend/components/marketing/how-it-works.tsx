const steps = [
  {
    step: '01',
    title: 'Choose your role',
    body: 'Open the app as a student or teacher. You log in with an email code.',
  },
  {
    step: '02',
    title: 'Add or view homework',
    body: 'Teachers create assignments; students see everything due, sorted by deadline.',
  },
  {
    step: '03',
    title: 'Track to completion',
    body: 'Mark work complete, edit details, and watch pending tasks disappear.',
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="border-t border-border bg-muted/40">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
        <div className="flex max-w-xl flex-col gap-3">
          <span className="text-sm font-medium text-primary">How it works</span>
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Three steps to start
          </h2>
        </div>

        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((item) => (
            <li key={item.step} className="flex flex-col gap-3">
              <span className="font-mono text-sm font-semibold text-primary">
                {item.step}
              </span>
              <span className="h-px w-full bg-border" />
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
