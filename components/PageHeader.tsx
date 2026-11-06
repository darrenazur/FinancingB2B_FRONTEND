interface PageHeaderProps {
  title: string
  description: string
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="mb-10">
      <h1 className="text-4xl font-semibold tracking-tight text-ink md:text-5xl">{title}</h1>
      <p className="mt-3 text-lg text-body">{description}</p>
    </header>
  )
}
