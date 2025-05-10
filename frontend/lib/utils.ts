import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 将DDL语句或者SQL字符串转换为标准的Markdown格式
 */
/**
 * Converts a DDL statement or SQL string into a Markdown-formatted code block.
 *
 * @param ddl - The DDL or SQL string to be converted.
 * @returns The input string formatted as a Markdown code block with SQL syntax highlighting.
 */
export function ddlToMarkdown(ddl: string): string {
  return "```sql\n" + ddl + "\n```";
}

function arrayToMarkdownTable(arr: any[]) {
  if (!arr || arr.length === 0) {
    return '';
  }

  const headers = Object.keys(arr[0]);
  const separator = headers.map(() => '---').join('|');
  const headerRow = headers.join('|');
  const dataRows = arr.map(obj => headers.map(header => obj[header]).join('|'));

  return `${headerRow}\n${separator}\n${dataRows.join('\n')}`;
}

/**
 * 将查询结果或者图表转换为标准的Markdown格式
 */
export function contentToMarkdown(content: string): string {
  try {
    if (content.includes('查询结果')) {
      const jsonContent = content.replace('查询结果:', '');
      // 数据转化md表格
      const tableJson = JSON.parse(jsonContent);
      return arrayToMarkdownTable(tableJson);
    }
    if (content.includes('plotly_chart')) {
      let jsonContent = content.replace('plotly_chart:', '');
      jsonContent = JSON.stringify(JSON.parse(jsonContent), null, 2);
      return "```json\n" + jsonContent + "\n```";
    }
    if (content.toLowerCase().includes('select')) {
      return "```sql\n" + content + "\n```";
    }
  } catch (error) {
    console.error(error);
    return content;
  }

  return content;
}