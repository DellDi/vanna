import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Search, Filter, Download } from "lucide-react"

export default function Loading() {
  return (
    <div className="container py-6 space-y-6">
      {/* <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">训练数据</h1>
        <p className="text-muted-foreground">
          添加或删除训练数据，高质量的训练数据是提高准确性的关键。
        </p>
      </div> */}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 w-full max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <Button variant="outline" size="icon" disabled>
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <Download className="mr-2 h-4 w-4" />
            导出
          </Button>
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>

      <div className="border rounded-md">
        <div className="border-b px-4 py-3 flex items-center justify-between bg-muted/50">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>

        <div className="divide-y">
          <div className="grid grid-cols-[80px_1fr_3fr_100px] gap-4 px-4 py-3 items-center">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="grid grid-cols-[80px_1fr_3fr_100px] gap-4 px-4 py-3 items-center">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-8 w-16 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center space-x-2">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
    </div>
  )
}
