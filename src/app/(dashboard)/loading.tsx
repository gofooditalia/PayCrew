export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Caricamento Dashboard...
          </h2>
          <p className="text-muted-foreground">
            Stiamo caricando i tuoi dati, attendere prego.
          </p>
        </div>
      </div>
    </div>
  )
}