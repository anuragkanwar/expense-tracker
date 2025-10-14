import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/recurrence/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/recurrence/"!</div>
}
