/** Primary navigation. Order = order in the header, mobile menu and footer. */
export const navLinks = [
  { href: "/blog", label: "blog", code: "01" },
  { href: "/projects", label: "projects", code: "02" },
  { href: "/about", label: "about", code: "03" },
  { href: "/contact", label: "contact", code: "04" },
] as const

export const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`)
