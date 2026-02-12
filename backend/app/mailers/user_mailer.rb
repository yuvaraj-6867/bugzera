class UserMailer < ApplicationMailer
  default from: 'admin@bugzera.com'

  def welcome_email(user, password)
    @user = user
    @password = password
    @login_url = "#{ENV['FRONTEND_URL'] || 'http://localhost:3000'}/login"
    
    mail(
      to: @user.email,
      subject: "Welcome to BugZera - Login Credentials"
    )
  end
end