class AutomationExecutionJob < ApplicationJob
  queue_as :default

  def perform(automation_script)
    test_run = TestRun.create!(
      test_case: automation_script.test_case,
      user: automation_script.user,
      automation_script: automation_script,
      status: 'running'
    )

    begin
      result = execute_playwright_script(automation_script.script_path)
      
      test_run.update!(
        status: result[:status],
        execution_time: result[:duration],
        notes: result[:output]
      )

      if result[:screenshot_path]
        test_run.screenshot.attach(
          io: File.open(result[:screenshot_path]),
          filename: "screenshot_#{test_run.id}.png"
        )
      end

      if result[:video_path]
        test_run.video.attach(
          io: File.open(result[:video_path]),
          filename: "video_#{test_run.id}.webm"
        )
      end

    rescue => e
      test_run.update!(
        status: 'failed',
        notes: "Execution error: #{e.message}"
      )
    end
  end

  private

  def execute_playwright_script(script_path)
    start_time = Time.current
    
    # Execute Playwright script
    output = `cd #{Rails.root}/automation && npx playwright test #{script_path} --reporter=json`
    exit_status = $?.exitstatus
    
    duration = (Time.current - start_time).to_i
    
    {
      status: exit_status == 0 ? 'passed' : 'failed',
      duration: duration,
      output: output,
      screenshot_path: find_screenshot_path(script_path),
      video_path: find_video_path(script_path)
    }
  end

  def find_screenshot_path(script_path)
    # Logic to find screenshot if test failed
    nil
  end

  def find_video_path(script_path)
    # Logic to find video if test failed
    nil
  end
end