class TestAutomationJob < ApplicationJob
  queue_as :default

  def perform(test_case_id, user_id)
    test_case = TestCase.find(test_case_id)
    user = User.find(user_id)
    
    test_run = TestRun.create!(
      test_case: test_case,
      user: user,
      status: 'running',
      started_at: Time.current
    )

    begin
      # Execute automation script
      automation_script = test_case.automation_scripts.active.first
      if automation_script
        result = execute_script(automation_script)
        test_run.update!(
          status: result[:status],
          result: result[:output],
          ended_at: Time.current
        )
        
        # Initiate user call if test fails
        if result[:status] == 'failed'
          initiate_failure_call(test_case, user)
        end
      end
    rescue => e
      test_run.update!(
        status: 'failed',
        result: e.message,
        ended_at: Time.current
      )
    end
  end

  private

  def execute_script(automation_script)
    # Simulate script execution
    { status: ['passed', 'failed'].sample, output: 'Test execution completed' }
  end

  def initiate_failure_call(test_case, user)
    # Find QA manager or assigned user
    receiver = test_case.assigned_user || User.where(role: 'manager').first
    
    UserCall.create!(
      caller: user,
      receiver: receiver,
      test_case: test_case,
      status: 'initiated',
      call_type: 'test_failure'
    )
  end
end