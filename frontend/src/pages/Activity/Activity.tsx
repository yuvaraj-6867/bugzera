const Activity = () => {
  const activities = [
    { id: 1, user: 'John Doe', action: 'created test case', item: 'TC-1234: Login Flow Test', time: '2 minutes ago', avatar: '👤' },
    { id: 2, user: 'Jane Smith', action: 'updated ticket', item: 'BUG-567: Fix navbar issue', time: '15 minutes ago', avatar: '👤' },
    { id: 3, user: 'Bob Wilson', action: 'completed test run', item: 'Sprint 23 - Regression Tests', time: '1 hour ago', avatar: '👤' },
    { id: 4, user: 'Alice Brown', action: 'commented on', item: 'TC-890: Payment Gateway', time: '2 hours ago', avatar: '👤' },
    { id: 5, user: 'Charlie Davis', action: 'uploaded document', item: 'API Documentation v2.0', time: '3 hours ago', avatar: '👤' },
  ]

  return (
    <div className="min-h-screen bg-[#FAFBFC] p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#0F172A] mb-2">Activity Feed</h1>
        <p className="text-[#64748B]">Real-time activity stream across all projects</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <select className="form-select w-48">
          <option>All Activities</option>
          <option>Test Cases</option>
          <option>Tickets</option>
          <option>Documents</option>
          <option>Comments</option>
        </select>
        <select className="form-select w-48">
          <option>All Projects</option>
          <option>Project Alpha</option>
          <option>Project Beta</option>
        </select>
        <select className="form-select w-48">
          <option>All Time</option>
          <option>Today</option>
          <option>This Week</option>
          <option>This Month</option>
        </select>
      </div>

      {/* Activity Stream */}
      <div className="space-y-4">
        {activities.map(activity => (
          <div key={activity.id} className="card flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="text-4xl">{activity.avatar}</div>
            <div className="flex-1">
              <p className="text-[#0F172A]">
                <span className="font-semibold">{activity.user}</span>
                {' '}<span className="text-gray-600">{activity.action}</span>
                {' '}<span className="font-medium text-accent-neon">{activity.item}</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      <div className="mt-8 text-center">
        <button className="btn btn-outline">Load More Activities</button>
      </div>
    </div>
  )
}

export default Activity
