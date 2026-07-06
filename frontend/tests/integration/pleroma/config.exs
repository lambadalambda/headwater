import Config

config :pleroma, Pleroma.Web.Endpoint,
	http: [ip: {0, 0, 0, 0}, port: 4000],
	secret_key_base: "mqG6GKCy4UnyR0siW1Flf3QNmXXQBmkXGmqnZEYE9zw6ODKAbJwY0fKgRNWS6gJWlHvYrMwZefF9bhlfRerOKQ==",
	signing_salt: "j29wtplYwgA",
	url: [host: "127.0.0.1", scheme: "http", port: String.to_integer(System.get_env("PLEROMANET_INTEGRATION_PORT", "4400"))]

config :pleroma, Pleroma.Repo,
	adapter: Ecto.Adapters.Postgres,
	database: System.get_env("DB_NAME", "pleroma"),
	hostname: System.get_env("DB_HOST", "db"),
	password: System.get_env("DB_PASS", "pleroma"),
	pool_size: 10,
	port: String.to_integer(System.get_env("DB_PORT", "5432")),
	username: System.get_env("DB_USER", "pleroma")

config :pleroma, :instance,
  name: "PleromaNet Integration",
  email: "admin@example.test",
  notify_email: "notify@example.test",
	registrations_open: false,
	federating: false,
	healthcheck: true

config :pleroma, :database, rum_enabled: false
config :pleroma, :instance, static_dir: "/var/lib/pleroma/static"
config :pleroma, Pleroma.Uploaders.Local, uploads: "/var/lib/pleroma/uploads"

config :web_push_encryption, :vapid_details,
	subject: "mailto:notify@example.test",
	public_key: "BDe9W9W-x6wi7BvewHBQTb9_Y-9wi8LCa0qtEtk3Mz_SJQ0u6OZkw7JPz3pBnj3ZshivhvNu4izUsUaw6Eiz7tU",
	private_key: "DRd_ra1KubvtIItWTWm3u7ANsM3TYj1TSrIKYTHi2r0"
