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

  def otp_email(user, otp)
    @user = user
    @otp = otp

    mail(
      to: @user.email,
      subject: "BugZera - Your Password Reset OTP"
    )
  end

  def notification_email(to_email, subject, body)
    @subject = subject
    @body    = body

    mail(
      to: to_email,
      subject: "BugZera - #{subject}"
    )
  end

  def contact_admin_email(sender_name, sender_email, message, admin_email)
    @sender_name  = sender_name
    @sender_email = sender_email
    @message      = message

    mail(
      to: admin_email,
      reply_to: sender_email,
      subject: "BugZera - Access Request from #{sender_name}"
    )
  end
end