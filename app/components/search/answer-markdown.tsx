import ReactMarkdown from "react-markdown";
import { Link } from "react-router";
import remarkGfm from "remark-gfm";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

const allowedElements = [
  "p",
  "strong",
  "em",
  "ul",
  "ol",
  "li",
  "a",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "h1",
  "h2",
  "h3",
  "blockquote",
  "code",
  "pre",
  "hr",
  "del",
  "br",
];

export function AnswerMarkdown({
  text,
  sourceUrls,
}: {
  text: string;
  sourceUrls: string[];
}) {
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      <ReactMarkdown
        skipHtml
        remarkPlugins={[remarkGfm]}
        allowedElements={allowedElements}
        unwrapDisallowed
        components={{
          p: ({ children }) => (
            <p className="whitespace-pre-wrap">{children}</p>
          ),
          h1: ({ children }) => <h3 className="font-semibold">{children}</h3>,
          h2: ({ children }) => <h3 className="font-semibold">{children}</h3>,
          h3: ({ children }) => <h3 className="font-semibold">{children}</h3>,
          ul: ({ children }) => (
            <ul className="list-disc space-y-1 pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-1 pl-5">{children}</ol>
          ),
          a: ({ children, href }) =>
            href && sourceUrls.includes(href) ? (
              <Link
                className="text-primary underline underline-offset-4"
                to={href}
              >
                {children}
              </Link>
            ) : (
              <span>{children}</span>
            ),
          table: ({ children }) => <Table>{children}</Table>,
          thead: ({ children }) => <TableHeader>{children}</TableHeader>,
          tbody: ({ children }) => <TableBody>{children}</TableBody>,
          tr: ({ children }) => <TableRow>{children}</TableRow>,
          th: ({ children }) => <TableHead>{children}</TableHead>,
          td: ({ children }) => (
            <TableCell className="whitespace-normal">{children}</TableCell>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 pl-4 text-muted-foreground">
              {children}
            </blockquote>
          ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-lg bg-muted p-3">
              {children}
            </pre>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
