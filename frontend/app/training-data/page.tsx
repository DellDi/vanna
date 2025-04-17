"use client"

import { useState } from "react"
import { Plus, Database, FileText, Settings, Download, Search, Filter, Trash2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DellDiLogo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useRouter } from "next/navigation"

export default function TrainingDataManagement() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)

  // Sample training data
  const trainingData = [
    {
      id: 1,
      question: "全集团的收入有多少?",
      content: "SELECT SUM(CAST(chargePaid AS DECIMAL(10, 2))) AS total_income FROM ns_dws.dws_target_finance;",
      type: "sql",
    },
    {
      id: 2,
      question: "集团前十的管家收入排名情况",
      content:
        "SELECT stewardName, SUM(CAST(chargePaid AS DECIMAL(10, 2))) AS total_income FROM ns_dws.dws_target_finance GROUP BY stewardName ORDER BY total_income DESC LIMIT 10;",
      type: "sql",
    },
    {
      id: 3,
      question: "null",
      content:
        "The following columns are in the dwd_organizations table in the def database: | | TABLE_CATALOG | TABLE_SCHEMA | TABLE_NAME | COLUMN_NAME | DATA_TYPE | COLUMN_COMMENT | |---:|---------------:|---------------:|------------:|------------:|-----------| -:|---------------:|---------------:|---------------:|------------:|-- -------------| | 0 | def | ns_dws | dwd_organizations | dwd_organization_id | bigint | | | 1 | def | ns_dws | dwd_organizations | dwd_organization_name | varchar | 项目名称| | | 2 | def | ns_dws | dwd_organizations | enterpriseId | bigint | 企业ID | | 3 | def | ns_dws | dwd_organizations | isDelete | int | 是否已删除 0:未删除 1:已删除 | | 4 | def | ns_dws | dwd_organizations | organizationParentId | bigint | 父级组织ID | | 5 | def | ns_dws | dwd_organizations | organizationPath | varchar | 组织路径 |",
      type: "documentation",
    },
    {
      id: 4,
      question: "金茂和狗狗的去年收入分别是多少?",
      content:
        "SELECT CASE WHEN dwd_organization_name = '中国金茂' THEN '金茂' WHEN dwd_organization_name = '金茂狗' THEN '狗' END AS organization, SUM(CAST(chargePaid AS DECIMAL(10, 2))) AS total_income_last_year FROM ns_dws.dws_target_finance tf JOIN ns_dws.dwd_organizations o ON tf.enterpriseID = o.enterpriseId WHERE currentDate BETWEEN '2022-01' AND '2022-12' GROUP BY CASE WHEN dwd_organization_name = '中国金茂' THEN '金茂' WHEN dwd_organization_name = '金茂狗' THEN '狗' END;",
      type: "sql",
    },
    {
      id: 5,
      question: "狗的去年收入",
      content:
        "SELECT SUM(CAST(chargePaid AS DECIMAL(10, 2))) AS total_income_last_year FROM ns_dws.dws_target_finance tf JOIN ns_dws.dwd_organizations o ON tf.enterpriseID = o.enterpriseId WHERE dwd_organization_name = '金茂狗' AND currentDate BETWEEN '2022-01' AND '2022-12';",
      type: "sql",
    },
    {
      id: 6,
      question: "数据库表结构",
      content:
        "The following columns are in the dwd_precincts table in the def database: | | TABLE_CATALOG | TABLE_SCHEMA | TABLE_NAME | COLUMN_NAME | DATA_TYPE | COLUMN_COMMENT | |---:|---------------:|---------------:|------------:|------------:|-----------| -:|---------------:|---------------:|---------------:|------------:|-- -------------| | 0 | def | ns_dws | dwd_precincts | precinct_id | bigint | | | 1 | def | ns_dws | dwd_precincts | precinct_name | varchar | 小区名称|",
      type: "documentation",
    },
  ]

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = trainingData.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(trainingData.length / itemsPerPage)

  const navigateToChat = () => {
    router.push("/")
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-72 border-r flex flex-col bg-card">
        <div className="p-4 flex items-center gap-2 border-b">
          <DellDiLogo className="h-8 w-8 text-primary" />
          <span className="text-xl font-semibold text-primary">DellDi</span>
          <ThemeToggle className="ml-auto" />
        </div>

        {/* New button area at the top left */}
        <div className="p-4 border-b">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Database size={14} className="mr-1" />
              Connect
            </Button>
            <Button variant="secondary" size="sm" className="flex-1">
              <Settings size={14} className="mr-1" />
              Settings
            </Button>
          </div>
        </div>

        <div className="p-4">
          <Button className="w-full justify-start gap-2" variant="default" onClick={navigateToChat}>
            <ArrowLeft size={16} />
            Back to Chat
          </Button>
        </div>

        <div className="px-4 py-2">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Recent Questions</h3>
        </div>

        <div className="overflow-y-auto flex-1 px-2">
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start text-left font-normal h-auto py-2">
              <div className="flex items-center gap-2 w-full">
                <FileText size={14} className="shrink-0 text-muted-foreground" />
                <span className="truncate">金茂的收入</span>
              </div>
            </Button>

            <Button variant="secondary" className="w-full justify-start text-left font-normal h-auto py-2">
              <div className="flex items-center gap-2 w-full">
                <FileText size={14} className="shrink-0" />
                <span className="truncate">金茂和狗狗的去年收入分别是多少?</span>
              </div>
            </Button>

            <Button variant="ghost" className="w-full justify-start text-left font-normal h-auto py-2">
              <div className="flex items-center gap-2 w-full">
                <FileText size={14} className="shrink-0 text-muted-foreground" />
                <span className="truncate">狗的去年收入</span>
              </div>
            </Button>
          </div>
        </div>

        <div className="mt-auto p-4 border-t flex items-center justify-between">
          <Badge variant="outline" className="text-xs bg-primary/10 text-primary">
            v1.0.2
          </Badge>
          <Button variant="ghost" size="sm" className="text-xs">
            Sign out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <div className="border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">Training Data</h1>
              <Badge variant="outline" className="ml-2">
                {trainingData.length} items
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Search..." className="w-[200px] pl-8" />
              </div>
              <Button variant="outline" size="sm">
                <Filter size={14} className="mr-1" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download size={14} className="mr-1" />
                Export
              </Button>
              <Button size="sm">
                <Plus size={14} className="mr-1" />
                Add training data
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <Card>
            <div className="p-4 border-b">
              <p className="text-sm text-muted-foreground">
                Add or remove training data. Good training data is the key to accuracy.
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Action</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead className="w-[150px]">Training Data Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Button variant="destructive" size="sm">
                        <Trash2 size={14} className="mr-1" />
                        Delete
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
                ))}
              </TableBody>
            </Table>
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
          </Card>
        </div>
      </div>
    </div>
  )
}
