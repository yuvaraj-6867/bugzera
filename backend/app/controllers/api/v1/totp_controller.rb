require 'openssl'

class Api::V1::TotpController < ApplicationController
  # Pure-Ruby TOTP (RFC 6238) without external gem
  BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

  def base32_encode(bytes)
    result = ''
    bytes.bytes.each_slice(5) do |chunk|
      n = chunk.inject(0) { |acc, b| (acc << 8) | b }
      bits = chunk.size * 8
      ceil_div5 = (bits.to_f / 5).ceil
      ceil_div5.times do |i|
        shift = bits - 5 * (i + 1)
        idx = shift >= 0 ? (n >> shift) & 0x1F : (n << (-shift)) & 0x1F
        result << BASE32_CHARS[idx]
      end
    end
    result
  end

  def base32_decode(str)
    str = str.upcase.gsub(/=/, '')
    result = []
    buffer = 0
    bits_in_buffer = 0
    str.each_char do |c|
      val = BASE32_CHARS.index(c)
      next unless val
      buffer = (buffer << 5) | val
      bits_in_buffer += 5
      if bits_in_buffer >= 8
        bits_in_buffer -= 8
        result << ((buffer >> bits_in_buffer) & 0xFF)
      end
    end
    result.pack('C*')
  end

  def totp_code(secret, time_step: nil)
    time_step ||= (Time.now.to_i / 30)
    key = base32_decode(secret)
    counter = [time_step].pack('Q>')
    hmac = OpenSSL::HMAC.digest('SHA1', key, counter)
    offset = hmac.bytes.last & 0x0F
    code = (hmac[offset..offset+3].unpack1('N') & 0x7FFFFFFF) % 1_000_000
    format('%06d', code)
  end

  def verify_totp(secret, user_code, window: 1)
    current = Time.now.to_i / 30
    (-window..window).any? do |delta|
      totp_code(secret, time_step: current + delta) == user_code.to_s.strip
    end
  end

  # GET /api/v1/totp/setup
  def setup
    secret = base32_encode(SecureRandom.random_bytes(20))
    current_user.update!(totp_secret: secret)
    email = current_user.email.gsub('+', '%2B')
    issuer = 'BugZera'
    otp_uri = "otpauth://totp/#{issuer}:#{email}?secret=#{secret}&issuer=#{issuer}&algorithm=SHA1&digits=6&period=30"
    render json: {
      secret: secret,
      otp_uri: otp_uri,
      qr_url: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=#{CGI.escape(otp_uri)}",
      enabled: current_user.totp_enabled
    }
  end

  # POST /api/v1/totp/enable  — body: { code: "123456" }
  def enable
    secret = current_user.totp_secret
    return render json: { error: 'Run setup first' }, status: :bad_request unless secret

    unless verify_totp(secret, params[:code])
      return render json: { error: 'Invalid verification code' }, status: :unprocessable_entity
    end

    # Generate 8 backup codes
    backup_codes = Array.new(8) { SecureRandom.hex(4).upcase }
    current_user.update!(totp_enabled: true, totp_backup_codes: backup_codes.to_json)
    render json: { enabled: true, backup_codes: backup_codes }
  end

  # POST /api/v1/totp/disable — body: { code: "123456" }
  def disable
    return render json: { error: '2FA is not enabled' }, status: :bad_request unless current_user.totp_enabled

    unless verify_totp(current_user.totp_secret, params[:code])
      return render json: { error: 'Invalid verification code' }, status: :unprocessable_entity
    end

    current_user.update!(totp_enabled: false, totp_secret: nil, totp_backup_codes: nil)
    render json: { enabled: false }
  end

  # GET /api/v1/totp/status
  def status
    render json: { enabled: current_user.totp_enabled }
  end
end
