import NrrNav from './nrr-nav'

export default function NrrLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NrrNav />
      {children}
    </>
  )
}
