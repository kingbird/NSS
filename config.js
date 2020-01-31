exports.config = {
	ROOT_DIR : '/data/kingbird.me/',
	PORT: 443,
	MAX_AGE: '100000',
	ssl: {
		key: '/data/nss/ssl/kingbird.me.key',
		cert: '/data/nss/ssl/kingbird.me.crt'
	}
}
