/**
 * 训练数据表格组件 - 用于展示和管理训练数据
 */
"use client"

import { useState } from "react"
import { TrainingData } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Trash2 } from "lucide-react"
import { removeTrainingDataAction } from "@/lib/actions"
import { toast } from "sonner"

interface TrainingDataTableProps {
  data: TrainingData[]
  onDataChange?: () => void
}

export function TrainingDataTable({ data, onDataChange }: TrainingDataTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [loading, setLoading] = useState<Record<string | number, boolean>>({})

  // 计算分页
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(data.length / itemsPerPage)

  const handleDelete = async (id: string | number) => {
    try {
      setLoading(prev => ({ ...prev, [id]: true }))
      await removeTrainingDataAction(String(id))
      toast.success("训练数据已删除")
      if (onDataChange) {
        onDataChange()
      }
    } catch (error) {
      console.error("删除训练数据失败:", error)
      toast.error("删除训练数据失败")
    } finally {
      setLoading(prev => ({ ...prev, [id]: false }))
    }
  }

  return (
    <Card>
      <div className="p-4 border-b">
        <p className="text-sm text-muted-foreground">
          添加或删除训练数据。高质量的训练数据是提高准确性的关键。
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">操作</TableHead>
            <TableHead>问题</TableHead>
            <TableHead>内容</TableHead>
            <TableHead className="w-[150px]">数据类型</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                暂无训练数据
              </TableCell>
            </TableRow>
          ) : (
            currentItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    disabled={loading[item.id]}
                  >
                    <Trash2 size={14} className="mr-1" />
                    {loading[item.id] ? "删除中..." : "删除"}
                  </Button>
                </TableCell>
                <TableCell className="font-medium">{item.question}</TableCell>
                <TableCell className="max-w-md">
                  <div className="max-h-24 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap font-mono bg-muted p-2 rounded-md">
                      {item.content}
                    </pre>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={item.type === "sql" ? "default" : "secondary"}>{item.type}</Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {totalPages > 1 && (
        <div className="p-4 border-t">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page}>
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </Card>
  )
}
