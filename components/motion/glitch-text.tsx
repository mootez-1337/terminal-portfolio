interface GlitchTextProps {
  text: string
  className?: string
}

/**
 * Glitch / RGB-split text. Pure CSS (see `.glitch` in styles/motion.css):
 * the two extra layers are ::before / ::after reading `data-text`, so the DOM,
 * search engines, screen readers and copy-paste only ever see the text once.
 */
export default function GlitchText({ text, className = "" }: GlitchTextProps) {
  return (
    <span className={`glitch ${className}`} data-text={text}>
      {text}
    </span>
  )
}
