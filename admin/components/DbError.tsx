/** Shown when Mongo isn't reachable — usually just "not configured yet" in Phase 3B. */
export default function DbError({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
      <p className="text-sm font-bold text-amber-900">Chưa kết nối được cơ sở dữ liệu</p>
      <p className="mt-1 font-mono text-xs text-amber-800">{message}</p>
      <p className="mt-2 text-xs text-amber-800">
        Điền MONGODB_URI và MONGODB_DB trong admin/.env — xem PLAN.md §3A.7.
      </p>
    </div>
  )
}
