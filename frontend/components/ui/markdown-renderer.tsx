/**
 * Markdown渲染器组件 - 支持语法高亮和代码复制功能
 */
'use client'

import { memo, useState, useMemo } from 'react'
import { useTheme } from 'next-themes'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import copy from 'copy-to-clipboard'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// 语言名称格式化函数
const getCorrectCapitalizationLanguageName = (language: string): string => {
  if (!language) return ''

  const languageMap: Record<string, string> = {
    'js': 'JavaScript',
    'javascript': 'JavaScript',
    'ts': 'TypeScript',
    'typescript': 'TypeScript',
    'jsx': 'JSX',
    'tsx': 'TSX',
    'py': 'Python',
    'python': 'Python',
    'sql': 'SQL',
    'bash': 'Bash',
    'shell': 'Shell',
    'json': 'JSON',
    'html': 'HTML',
    'css': 'CSS',
    'md': 'Markdown',
    'markdown': 'Markdown',
    'yml': 'YAML',
    'yaml': 'YAML',
    'xml': 'XML',
    'go': 'Go',
    'rust': 'Rust',
    'java': 'Java',
    'c': 'C',
    'cpp': 'C++',
    'csharp': 'C#',
    'php': 'PHP',
    'ruby': 'Ruby',
    'swift': 'Swift',
    'kotlin': 'Kotlin',
    'dart': 'Dart',
    'r': 'R',
    'scala': 'Scala',
    'perl': 'Perl',
    'lua': 'Lua',
    'haskell': 'Haskell',
    'graphql': 'GraphQL',
    'dockerfile': 'Dockerfile',
    'docker': 'Dockerfile',
    'nginx': 'Nginx',
    'apache': 'Apache',
    'ini': 'INI',
    'toml': 'TOML',
    'diff': 'Diff',
    'echarts': 'ECharts',
  }

  return languageMap[language.toLowerCase()] || language
}

// 代码块组件
const CodeBlock = memo(({ inline, className, children = '', ...props }: any) => {
  const { theme } = useTheme()
  const [copied, setCopied] = useState(false)
  const match = /language-(\w+)/.exec(className || '')
  const language = match?.[1] || ''
  const languageShowName = getCorrectCapitalizationLanguageName(language)

  // 处理代码复制
  const handleCopy = () => {
    const code = String(children).replace(/\n$/, '')
    copy(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // 内联代码
  if (inline) {
    return (
      <code className="px-1.5 py-0.5 text-sm rounded-md bg-muted font-mono text-primary" {...props}>
        {children}
      </code>
    )
  }

  // 代码块
  const codeString = String(children).replace(/\n$/, '')
  const codeStyle = theme === 'dark' ? vscDarkPlus : vs

  return (
    <div className="relative group not-prose">
      {/* 语言标签和复制按钮 */}
      <div className="absolute right-2 top-2 flex items-center gap-2">
        {languageShowName && (
          <span className="text-xs px-2 py-1 rounded bg-primary/60 text-primary-foreground font-medium">
            {languageShowName}
          </span>
        )}
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md bg-muted hover:bg-muted/80 text-foreground transition-colors"
          aria-label="复制代码"
        >
          {copied ? (
            <Check size={14} className="text-green-500" />
          ) : (
            <Copy size={14} />
          )}
        </button>
      </div>

      {/* 语法高亮 */}
      <SyntaxHighlighter
        language={language || 'text'}
        style={codeStyle}
        customStyle={{
          margin: 0,
          borderRadius: '0.5rem',
          padding: '1.5rem 1rem',
          fontSize: '0.875rem',
          backgroundColor: theme === 'dark' ? '#1E1E1E' : '#FFFFFF',
        }}
        codeTagProps={{
          style: {
            fontSize: '0.875rem',
            fontFamily: 'var(--font-mono)',
          },
        }}
        PreTag="div"
        {...props}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  )
})

CodeBlock.displayName = 'CodeBlock'

// 自定义组件映射
const components = {
  code: CodeBlock,
  // 添加其他自定义组件
  pre: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  a: ({ href, children, ...props }: any) => (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
      className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
      {...props}
    >
      {children}
    </a>
  ),
  h1: ({ children, ...props }: any) => (
    <h1 className="text-2xl font-bold mt-6 mb-4" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2 className="text-xl font-bold mt-5 mb-3" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 className="text-lg font-bold mt-4 mb-2" {...props}>
      {children}
    </h3>
  ),
  ul: ({ children, ...props }: any) => (
    <ul className="list-disc pl-6 my-4 space-y-2" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol className="list-decimal pl-6 my-4 space-y-2" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="mb-1" {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }: any) => (
    <blockquote className="border-l-4 border-primary/30 pl-4 py-1 my-4 text-muted-foreground" {...props}>
      {children}
    </blockquote>
  ),
  table: ({ children, ...props }: any) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border-collapse" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: any) => (
    <thead className="bg-muted" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }: any) => (
    <tbody className="divide-y divide-border" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }: any) => (
    <tr className="hover:bg-muted/50 transition-colors" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }: any) => (
    <th className="px-4 py-2 text-left font-medium" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: any) => (
    <td className="px-4 py-2 border-t border-border" {...props}>
      {children}
    </td>
  ),
  hr: () => <hr className="my-6 border-t border-border" />,
  img: ({ src, alt, ...props }: any) => (
    <img
      src={src}
      alt={alt || '图片'}
      className="max-w-full h-auto my-4 rounded-md"
      loading="lazy"
      {...props}
    />
  ),
}

interface MarkdownRendererProps {
  content: string
  className?: string
}

/**
 * Markdown渲染器组件
 * @param content Markdown内容
 * @param className 自定义样式类名
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const { theme } = useTheme()

  return (
    <div
      className={cn(
        "prose prose-sm max-w-none",
        theme === 'dark' ? 'prose-invert dark-code' : 'light-code',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
