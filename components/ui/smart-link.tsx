import type React from "react"
import { Link } from "next-view-transitions"

interface SmartLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string
  children: React.ReactNode
}

/** Internal links get page transitions; external ones open in a new tab. */
export default function SmartLink({ href, children, ...rest }: SmartLinkProps) {
  if (/^(https?:|mailto:)/.test(href)) {
    const external = href.startsWith("http")
    return (
      <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...rest}>
        {children}
      </a>
    )
  }
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  )
}
