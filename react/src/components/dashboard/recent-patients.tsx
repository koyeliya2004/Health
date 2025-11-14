"use client"
import { useEffect, useMemo, useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MoreVertical, RefreshCw } from "lucide-react"
import EditPatientModal from "./EditPatientModal"
import ConfirmDeleteModal from "./ConfirmDeleteModal"
import { useAuth } from "@/lib/auth"

type Patient = {
  id: string
  name: string
  age?: number
  icd11?: string
  disease?: string
  createdAt?: string
  createdBy?: string
}

type AuthUser = { id?: string; email?: string } | null

export default function RecentPatients() {
  const { user, authFetch } = useAuth()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<Patient | null>(null)
  const [deleting, setDeleting] = useState<Patient | null>(null)

  // load patients (can be triggered by refresh)
  const loadPatients = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    try {
      const res = await authFetch("/api/patients", { signal })
      if (!res.ok) {
        console.error('failed to fetch patients', await res.text())
        setPatients([])
        return
      }
  const data = await res.json()
  setPatients(data.patients || [])
    } catch (err) {
      const e = err as { name?: string }
      if (e?.name === 'AbortError') return
      console.error('patients fetch error', err)
      setPatients([])
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    const controller = new AbortController()
    loadPatients(controller.signal)
    return () => controller.abort()
  }, [loadPatients])

  // const openOptions = () => {
  //   return(
  //     <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/20 transition-colors">
  //       H
  //     </div>
  //   )
  // }
  // const toggleOptions = () => {
    
  // }
  const myPatients = useMemo(() => {
    if (!user) return []
    const u = user as AuthUser
    const userEmail = u?.email
    const userId = u?.id
    return patients.filter(p => p.createdBy === userId || p.createdBy === userEmail)
  }, [patients, user])

  return (
    <Card className="bg-card border-border p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Recent Patients</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => loadPatients()} disabled={loading} aria-label="Refresh patients">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          
        </div>
      </div>

      <div className="space-y-4">
        {loading && <p className="text-sm text-muted-foreground">Loading patients…</p>}
        {!loading && myPatients.length === 0 && (
          <p className="text-sm text-muted-foreground">No patients yet.</p>
        )}

        {myPatients.map((patient) => (
          <div key={patient.id} className="p-0">
            <div className="flex items-center justify-between sm:hidden p-3 rounded-lg border border-border hover:bg-secondary/20 transition-colors">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{patient.name || '—'}</p>
                <p className="text-xs text-muted-foreground truncate">{patient.disease ? patient.disease : (patient.icd11 || '—')}</p>
              </div>
              <div className="flex items-center gap-3 ml-3">
                <span className="text-xs text-muted-foreground">Age: {patient.age ?? '—'}</span>
                <Button variant="ghost" size="sm" onClick={() => setEditing(patient)}>
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="hidden sm:flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/20 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {patient.name ? patient.name.split(" ")[0][0] : "P"}
                      {patient.name && patient.name.split(" ")[1] ? patient.name.split(" ")[1][0] : ""}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{patient.name}</p>
                    <p className="text-xs text-muted-foreground">{patient.disease ? `${patient.disease} ${patient.icd11 ? `(${patient.icd11})` : ''}` : (patient.icd11 || "—")}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Age: {patient.age ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{patient.createdAt ? new Date(patient.createdAt).toLocaleString() : "—"}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setEditing(patient)}>
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        <EditPatientModal open={!!editing} onClose={() => setEditing(null)} patient={editing} onSaved={() => { setEditing(null); loadPatients() }} onRequestDelete={(p) => { setEditing(null); setDeleting(p) }} />
        <ConfirmDeleteModal open={!!deleting} onClose={() => setDeleting(null)} patient={deleting} onDeleted={() => { setDeleting(null); loadPatients() }} />
      </div>
    </Card>
  )
}
