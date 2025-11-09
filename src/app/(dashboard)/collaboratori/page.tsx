import CollaboratoriList from '@/components/collaboratori/collaboratori-list'

export default function CollaboratoriPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Collaboratori Esterni</h1>
        <p className="text-muted-foreground mt-2">
          Gestisci prestatori occasionali, partite IVA e consulenti esterni
        </p>
      </div>

      <CollaboratoriList />
    </div>
  )
}
