export const MarkdownIcon = ({ className }: { className?: string }) => {
  return (
    <div className={`${className} flex items-center `}> 
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 208 128" fill="currentColor">
      <rect width="198" height="118" x="5" y="5" ry="10" stroke="#000" stroke-width="10" fill="none"/>
      <path d="M30 98V30h20l20 25 20-25h20v68H90V59L70 84 50 59v39zm125 0l-30-33h20V30h20v35h20z"/>
      </svg>
    </div>
  )
}