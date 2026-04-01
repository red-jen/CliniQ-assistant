import { useState, useRef } from "react"
import { ragAPI } from "../lib/api"
import { Button } from "../components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card"
import { Spinner } from "../components/ui/spinner"
import { Upload, FileText, CheckCircle2, XCircle, File, Trash2 } from "lucide-react"

interface UploadedFile {
  name: string
  status: "uploading" | "success" | "error"
  message?: string
  chunks?: number
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File) => {
    const fileEntry: UploadedFile = { name: file.name, status: "uploading" }
    setFiles((prev) => [...prev, fileEntry])

    try {
      const result = await ragAPI.uploadPdf(file)
      setFiles((prev) =>
        prev.map((f) =>
          f.name === file.name
            ? { ...f, status: "success", message: result.message || "Indexed successfully", chunks: result.chunks }
            : f
        )
      )
    } catch (err: any) {
      setFiles((prev) =>
        prev.map((f) =>
          f.name === file.name
            ? { ...f, status: "error", message: err.response?.data?.detail || "Upload failed" }
            : f
        )
      )
    }
  }

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return
    Array.from(fileList)
      .filter((f) => f.type === "application/pdf")
      .forEach(uploadFile)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name))
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold">Upload Documents</h2>
        <p className="mt-1 text-muted-foreground">Upload medical PDF documents to build the knowledge base</p>
      </div>

      {/* Drop zone */}
      <Card
        className={`cursor-pointer transition-colors ${
          dragActive ? "border-primary bg-primary/5" : "border-dashed hover:border-primary/50"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Drop PDF files here</h3>
          <p className="mt-2 text-sm text-muted-foreground">or click to browse files</p>
          <p className="mt-1 text-xs text-muted-foreground">Supports PDF files up to 50MB</p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </CardContent>
      </Card>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Uploaded Files</h3>
          {files.map((file, i) => (
            <Card key={i} className="flex items-center gap-4 px-4 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className={`text-xs ${file.status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                  {file.status === "uploading" && "Indexing..."}
                  {file.status === "success" && `${file.message}${file.chunks ? ` (${file.chunks} chunks)` : ""}`}
                  {file.status === "error" && file.message}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {file.status === "uploading" && <Spinner size={18} />}
                {file.status === "success" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                {file.status === "error" && <XCircle className="h-5 w-5 text-destructive" />}
                <Button variant="ghost" size="icon" onClick={() => removeFile(file.name)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
