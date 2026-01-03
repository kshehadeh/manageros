'use client'

import { cn } from '@/lib/utils'
import {
  createContext,
  type HTMLAttributes,
  useEffect,
  useRef,
  useState,
} from 'react'
import { type BundledLanguage, codeToHtml, type ShikiTransformer } from 'shiki'

type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string
  language: BundledLanguage
  showLineNumbers?: boolean
}

type CodeBlockContextType = {
  code: string
}

const CodeBlockContext = createContext<CodeBlockContextType>({
  code: '',
})

const lineNumberTransformer: ShikiTransformer = {
  name: 'line-numbers',
  line(node, line) {
    node.children.unshift({
      type: 'element',
      tagName: 'span',
      properties: {
        className: [
          'inline-block',
          'min-w-10',
          'mr-4',
          'text-right',
          'select-none',
          'text-muted-foreground',
        ],
      },
      children: [{ type: 'text', value: String(line) }],
    })
  },
}

async function highlightCode(
  code: string,
  language: BundledLanguage,
  showLineNumbers = false
) {
  const transformers: ShikiTransformer[] = showLineNumbers
    ? [lineNumberTransformer]
    : []

  return await Promise.all([
    codeToHtml(code, {
      lang: language,
      theme: 'one-light',
      transformers,
    }),
    codeToHtml(code, {
      lang: language,
      theme: 'one-dark-pro',
      transformers,
    }),
  ])
}

export const CodeBlock = ({
  code,
  language,
  showLineNumbers = false,
  className,
  children,
  ...props
}: CodeBlockProps) => {
  const [html, setHtml] = useState<string>('')
  const [darkHtml, setDarkHtml] = useState<string>('')
  const mounted = useRef(false)

  useEffect(() => {
    highlightCode(code, language, showLineNumbers).then(([light, dark]) => {
      if (!mounted.current) {
        setHtml(light)
        setDarkHtml(dark)
        mounted.current = true
      }
    })

    return () => {
      mounted.current = false
    }
  }, [code, language, showLineNumbers])

  return (
    <CodeBlockContext.Provider value={{ code }}>
      <div
        className={cn(
          'group relative w-full overflow-hidden rounded-md border bg-background text-foreground',
          className
        )}
        {...props}
      >
        <div className='relative'>
          <div
            className='overflow-auto dark:hidden [&>pre]:m-0 [&>pre]:bg-background! [&>pre]:p-4 [&>pre]:text-foreground! [&>pre]:text-sm [&_code]:font-mono [&_code]:text-sm'
            // biome-ignore lint/security/noDangerouslySetInnerHtml: "this is needed."
            dangerouslySetInnerHTML={{ __html: html }}
          />
          <div
            className='hidden overflow-auto dark:block [&>pre]:m-0 [&>pre]:bg-background! [&>pre]:p-4 [&>pre]:text-foreground! [&>pre]:text-sm [&_code]:font-mono [&_code]:text-sm'
            // biome-ignore lint/security/noDangerouslySetInnerHtml: "this is needed."
            dangerouslySetInnerHTML={{ __html: darkHtml }}
          />
          {children && (
            <div className='absolute top-2 right-2 flex items-center gap-2'>
              {children}
            </div>
          )}
        </div>
      </div>
    </CodeBlockContext.Provider>
  )
}
