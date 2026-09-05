import { redirect } from 'next/navigation'

/** No dashboard home — products is the thing the admin actually opens. */
export default function AdminIndex() {
  redirect('/products')
}
