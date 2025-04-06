import { Meta } from '@/components/common/meta'
import Welcome from '@/components/common/welcome'
import { getAllExperiments } from '@/lib/experiments.server'

export default async function ExperimentsPage() {
  const experiments = await getAllExperiments()
  
  return (
    <div className="min-h-screen bg-background">
      <Meta />
      <Welcome experiments={experiments} />
    </div>
  )
}