"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
// 直接使用React.ComponentProps获取NextThemesProvider的属性类型
type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
