class TestExecutionSimulatorJob < ApplicationJob
  queue_as :default

  def perform(test_run_id)
    test_run = TestRun.find(test_run_id)
    settings = JSON.parse(test_run.settings || '{}')
    repo_url = settings['repository_url']
    branch = settings['branch'] || 'main'
    
    begin
      # Step 1: Git Clone (5-10s)
      test_run.update!(status: 'running', current_step: 'git_clone')
      clone_repository(repo_url, branch, test_run.id)
      sleep(rand(5..10)) # Simulate clone time
      
      # Step 2: Install Dependencies (10-20s)
      test_run.update!(current_step: 'install_deps')
      install_dependencies(test_run.id)
      sleep(rand(10..20)) # Simulate install time
      
      # Step 3: Run Tests (30-60s)
      test_run.update!(current_step: 'test_execution')
      test_results = run_tests(test_run.id)
      sleep(rand(30..60)) # Simulate test execution time
      
      # Step 4: Process Results (5-10s)
      test_run.update!(current_step: 'processing_results')
      sleep(rand(5..10)) # Simulate processing time
      final_status = test_results[:success] ? 'passed' : 'failed'
      
    rescue => e
      final_status = 'failed'
      Rails.logger.error "Test execution failed: #{e.message}"
    ensure
      # Cleanup
      cleanup_workspace(test_run.id)
      
      execution_time = Time.current - test_run.created_at
      test_run.update!(
        status: final_status,
        current_step: 'completed',
        execution_time: execution_time.to_i
      )
      
      # Send notifications only for pass/fail
      if ['passed', 'failed'].include?(final_status)
        send_slack_notification(test_run, final_status)
        NotificationService.test_run_completed(test_run) rescue nil
        WebhookService.deliver_event(test_run.project_id, 'test_run.completed', { id: test_run.id, status: final_status, project: test_run.project&.name }) rescue nil

        # Direct email to the test run creator
        if test_run.user
          label = final_status == 'passed' ? 'Passed ✓' : 'Failed ✗'
          UserMailer.notification_email(
            test_run.user.email,
            "Test Run ##{test_run.id} #{label}",
            "Your test run ##{test_run.id} for project #{test_run.project&.name} has #{final_status}.\nExecution time: #{test_run.execution_time}s."
          ).deliver_now rescue nil
        end
      end
    end
  end

  private

  def clone_repository(repo_url, branch, run_id)
    return unless repo_url.present?
    
    workspace_dir = "/tmp/test_run_#{run_id}"
    FileUtils.rm_rf(workspace_dir) if Dir.exist?(workspace_dir)
    
    system("git clone --depth 1 --branch #{branch} #{repo_url} #{workspace_dir}")
  end

  def install_dependencies(run_id)
    workspace_dir = "/tmp/test_run_#{run_id}"
    return unless Dir.exist?(workspace_dir)
    
    Dir.chdir(workspace_dir) do
      if File.exist?('package.json')
        system('npm install --silent')
      elsif File.exist?('requirements.txt')
        system('pip install -r requirements.txt')
      end
    end
  end

  def run_tests(run_id)
    workspace_dir = "/tmp/test_run_#{run_id}"
    
    # If no workspace directory (no repo cloned), run in demo mode
    unless Dir.exist?(workspace_dir)
      Rails.logger.info "Running in demo mode - no repository cloned"
      return run_demo_tests
    end
    
    Dir.chdir(workspace_dir) do
      project_type = detect_project_type
      Rails.logger.info "Detected project type: #{project_type}"
      
      case project_type
      when :playwright_js
        run_playwright_tests
      when :cypress
        run_cypress_tests
      when :selenium_python
        run_selenium_python_tests
      when :pytest
        run_pytest_tests
      when :jest
        run_jest_tests
      when :mocha
        run_mocha_tests
      when :maven_java
        run_maven_tests
      when :gradle_java
        run_gradle_tests
      else
        run_generic_tests
      end
    end
  end

  def detect_project_type
    # Check for Playwright
    if File.exist?('playwright.config.js') || File.exist?('playwright.config.ts')
      return :playwright_js
    end
    
    # Check for Cypress
    if File.exist?('cypress.config.js') || Dir.exist?('cypress')
      return :cypress
    end
    
    # Check for Python Selenium
    if File.exist?('requirements.txt') && File.read('requirements.txt').include?('selenium')
      return :selenium_python
    end
    
    # Check for pytest
    if File.exist?('pytest.ini') || File.exist?('pyproject.toml') || Dir.exist?('tests')
      return :pytest
    end
    
    # Check for Jest
    if File.exist?('jest.config.js') || (File.exist?('package.json') && File.read('package.json').include?('jest'))
      return :jest
    end
    
    # Check for Mocha
    if File.exist?('mocha.opts') || (File.exist?('package.json') && File.read('package.json').include?('mocha'))
      return :mocha
    end
    
    # Check for Maven Java
    if File.exist?('pom.xml')
      return :maven_java
    end
    
    # Check for Gradle Java
    if File.exist?('build.gradle') || File.exist?('build.gradle.kts')
      return :gradle_java
    end
    
    # Default to Node.js if package.json exists
    if File.exist?('package.json')
      return :nodejs
    end
    
    :unknown
  end

  def run_playwright_tests
    # For demo purposes, simulate test execution
    Rails.logger.info "Running Playwright tests (simulated)"
    
    # Random pass/fail for realistic simulation
    result = [true, false, true].sample  # 66% pass, 33% fail
    
    Rails.logger.info "Playwright test result: #{result ? 'PASSED' : 'FAILED'}"
    { success: result }
  end

  def run_cypress_tests
    result = system('npx cypress run --reporter json --record --video > test_results.json 2>&1')
    { success: result }
  end

  def run_selenium_python_tests
    result = system('python -m pytest --json-report --json-report-file=test_results.json 2>&1')
    { success: result }
  end

  def run_pytest_tests
    result = system('python -m pytest --json-report --json-report-file=test_results.json 2>&1')
    { success: result }
  end

  def run_jest_tests
    result = system('npm test -- --json --outputFile=test_results.json 2>&1')
    { success: result }
  end

  def run_mocha_tests
    result = system('npx mocha --reporter json > test_results.json 2>&1')
    { success: result }
  end

  def run_maven_tests
    result = system('mvn test -Dmaven.test.failure.ignore=true 2>&1')
    { success: result }
  end

  def run_gradle_tests
    result = system('./gradlew test --continue 2>&1')
    { success: result }
  end

  def run_generic_tests
    # Try common test commands
    if File.exist?('package.json')
      result = system('npm test 2>&1')
      return { success: result }
    end
    
    if File.exist?('Makefile')
      result = system('make test 2>&1')
      return { success: result }
    end
    
    { success: false }
  end

  def run_demo_tests
    # Simulate test execution without actual repository
    Rails.logger.info "Running demo test simulation"
    
    # Random pass/fail for demo
    success = [true, false].sample
    Rails.logger.info "Demo test result: #{success ? 'PASSED' : 'FAILED'}"
    
    { success: success }
  end

  def cleanup_workspace(run_id)
    workspace_dir = "/tmp/test_run_#{run_id}"
    FileUtils.rm_rf(workspace_dir)
  end



  def send_slack_notification(test_run, status)
    # Get webhook URL from project only
    webhook_url = test_run.project&.webhook_url&.strip
    
    return unless webhook_url.present?
    
    user = test_run.user || User.first
    
    if status == 'failed'
      message = ":x: *Test Execution Failed*\n" \
                "Test Run: ##{test_run.id}\n" \
                "Project: #{test_run.project&.name || 'BugZera'}\n" \
                "Duration: #{test_run.execution_time}s\n" \
                "Status: Failed"
    elsif status == 'passed'
      message = ":white_check_mark: *Test Execution Passed*\n" \
                "Test Run: ##{test_run.id}\n" \
                "Project: #{test_run.project&.name || 'BugZera'}\n" \
                "Duration: #{test_run.execution_time}s\n" \
                "Status: Passed"
    else
      return
    end
    
    payload = {
      text: message,
      username: "BugZera Bot",
      icon_emoji: ":robot_face:"
    }
    
    Rails.logger.info "Sending Slack notification to: #{webhook_url}"
    Rails.logger.info "Message: #{message}"
    
    begin
      require 'net/http'
      require 'uri'
      require 'json'
      
      uri = URI(webhook_url)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      
      request = Net::HTTP::Post.new(uri)
      request['Content-Type'] = 'application/json'
      request.body = payload.to_json
      
      response = http.request(request)
      Rails.logger.info "Slack response: #{response.code} - #{response.body}"
    rescue => e
      Rails.logger.error "Failed to send Slack notification: #{e.message}"
    end
  end
end